use std::io::BufReader;

use ic_cdk::export::candid::{CandidType, Deserialize};
use once_cell::sync::OnceCell;

use relation_graph_core::io::GraphFormat;
use relation_graph_core::MemoryStore;
use relation_graph_core::model::{GraphName, NamedNode};
use relation_graph_core::sparql::{Query, QueryResults, QueryResultsFormat, Update};

use crate::error::{Error, Result};

const PREFIX: &str = "
      prefix : <http://relationlabs.ai/entity/>
      prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      prefix xsd: <http://www.w3.org/2001/XMLSchema#>
";
const GRAPH_NAME_ACL: &str = "http://relationlabs.ai/acl/";

static DB: OnceCell<MemoryStore> = OnceCell::new();

#[derive(Clone, Debug, CandidType, Deserialize)]
struct StoreSnapshot {
    data: Vec<u8>,
    acl_data: Vec<u8>,
}

pub(crate) fn init() -> Result {
    DB.get_or_try_init(|| {
        let store = MemoryStore::new();
        // acl graph
        let acl_data = include_bytes!("../../data/relation_acl.ttl");
        let acl_graph = GraphName::from(NamedNode::new(GRAPH_NAME_ACL).unwrap());
        store.load_graph(BufReader::new(&acl_data[..]),
                         GraphFormat::Turtle,
                         &acl_graph,
                         None)
            .map_err(Error::from)?;

        // default graph
        let data = include_bytes!("../../data/relation_samples.ttl");
        store.load_graph(BufReader::new(&data[..]),
                         GraphFormat::Turtle,
                         &GraphName::DefaultGraph,
                         None)
            .map(|_| store)
            .map_err(Error::from)
    }).map(|_| ())
}

pub(crate) fn take_snapshot() -> Result {
    // Dump graph data
    // default graph data
    let mut data = Vec::new();
    store().dump_graph(&mut data, GraphFormat::NTriples, &GraphName::DefaultGraph)
        .map_err(Error::from)?;

    // ACL graph data
    let acl_graph = GraphName::from(NamedNode::new(GRAPH_NAME_ACL).unwrap());
    let mut acl_data = Vec::new();
    store().dump_graph(&mut acl_data, GraphFormat::NTriples, &acl_graph)
        .map_err(Error::from)?;

    // Saves graph data into the stable memory
    let snapshot = StoreSnapshot { data, acl_data };
    ic_cdk::storage::stable_save((snapshot, )).map_err(Error::from)?;
    Ok(())
}

pub(crate) fn restore_snapshot() -> Result {
    // Create new store and load the graph data
    let store = MemoryStore::new();
    // Restores graph data from the stable memory
    let (stable_store, ): (StoreSnapshot, ) = ic_cdk::storage::stable_restore().map_err(Error::StoreICRestore)?;

    // restore default graph data
    let data = stable_store.data;
    store.load_graph(&data[..], GraphFormat::NTriples, &GraphName::DefaultGraph, None)
        .map_err(Error::from)?;

    // restore acl graph data
    let acl_graph: GraphName = GraphName::from(NamedNode::new(GRAPH_NAME_ACL).unwrap());
    let acl_data = stable_store.acl_data;
    store.load_graph(&acl_data[..], GraphFormat::NTriples, &acl_graph, None)
        .map_err(Error::from)?;

    DB.set(store).map_err(|_| Error::StoreICRestore("GraphDB failed to restore".into()))?;
    Ok(())
}

fn store() -> &'static MemoryStore {
    DB.get().expect("GraphDB uninitialized")
}

/// Execute SPARQL query and return result
pub(crate) fn sparql_raw_query(query: &str) -> Result<QueryResults> {
    let sparql = format!("
      {}
      {}
    ", PREFIX, query);
    let query = Query::parse(&sparql, None).map_err(Error::from)?;
    Ok(store().query(query).map_err(Error::from)?)
}

/// Execute SPARQL query and return result as string (mainly used for CLI)
pub(crate) fn sparql_query(result_format: &str, query: &str) -> Result<String> {
    let result_format = match result_format {
        "json" => QueryResultsFormat::Json,
        "tsv" => QueryResultsFormat::Tsv,
        "csv" => QueryResultsFormat::Csv,
        "xml" => QueryResultsFormat::Xml,
        _ => QueryResultsFormat::Tsv,
    };

    let result = sparql_raw_query(query)?;
    let mut buffer = Vec::default();
    result.write(&mut buffer, result_format).map_err(Error::from)?;
    Ok(String::from_utf8_lossy(&buffer[..]).to_string())
}

/// Execute SPARQL update(INSERT, DELETE/INSERT, DELETE) and return result
pub(crate) fn sparql_update(update: &str) -> Result {
    let sparql = format!("
      {}
      {}
    ", PREFIX, update);
    let update = Update::parse(&sparql, None).map_err(Error::from)?;
    store().update(update).map(|_| ()).map_err(Error::from)
}
