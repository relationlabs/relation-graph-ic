relation-graph
========

relation-graph is a graph database library implementing the [SPARQL](https://www.w3.org/TR/sparql11-overview/) standard.

Its goal is to provide a compliant, safe and fast graph database.
It also provides a set of utility functions for reading, writing, and processing RDF files.

relation-graph implements the following specifications:
* [SPARQL 1.1 Query](https://www.w3.org/TR/sparql11-query/), [SPARQL 1.1 Update](https://www.w3.org/TR/sparql11-update/), and [SPARQL 1.1 Federated Query](https://www.w3.org/TR/sparql11-federated-query/).
* [Turtle](https://www.w3.org/TR/turtle/), [TriG](https://www.w3.org/TR/trig/), [N-Triples](https://www.w3.org/TR/n-triples/), [N-Quads](https://www.w3.org/TR/n-quads/), and [RDF XML](https://www.w3.org/TR/rdf-syntax-grammar/) RDF serialization formats for both data ingestion and retrieval using the [Rio library](https://github.com/oxigraph/rio).
* [SPARQL Query Results XML Format](http://www.w3.org/TR/rdf-sparql-XMLres/), [SPARQL 1.1 Query Results JSON Format](https://www.w3.org/TR/sparql11-results-json/) and [SPARQL 1.1 Query Results CSV and TSV Formats](https://www.w3.org/TR/sparql11-results-csv-tsv/).

Usage example with the `MemoryStore`:

```rust
use relation_graph_core::MemoryStore;
use relation_graph_core::model::*;
use relation_graph_core::sparql::QueryResults;

let store = MemoryStore::new();

// insertion
let ex = NamedNode::new("http://example.com")?;
let quad = Quad::new(ex.clone(), ex.clone(), ex.clone(), None);
store.insert(quad.clone());

// quad filter
let results: Vec<Quad> = store.quads_for_pattern(Some(ex.as_ref().into()), None, None, None).collect();
assert_eq!(vec![quad], results);

// SPARQL query
if let QueryResults::Solutions(mut solutions) =  store.query("SELECT ?s WHERE { ?s ?p ?o }")? {
    assert_eq!(solutions.next().unwrap()?.get("s"), Some(&ex.into()));
}
```

## Prerequisite

```shell
rustup target add wasm32-unknown-unknown

# install SDK
sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"
```

## Run

```shell
dfx start --clean --background
dfx deploy
```

**Example: hello**
```shell
dfx canister call relation_graph_hello hello
```

### ACL

#### Grant Permission

* arg1: principal
* arg2: role (values: user, admin)
```shell
dfx canister call relation_graph acl_grant '("rrkah-fqaaa-aaaaa-aaaaq-cai","user")'
```
#### Revoke Permission

* arg1: principal
```shell
dfx canister call relation_graph acl_revoke rrkah-fqaaa-aaaaa-aaaaq-cai
```

#### Show Permissions

* arg1: limit (limit of how many records returned)
```shell
dfx canister call relation_graph acl_show 10
```

### SPARQL

#### Query

* arg1: `tsv, csv, xml, json`
* arg2: sparql query

Query-1:
```sparql
dfx canister call relation_graph sparql_query '("tsv","
SELECT *
WHERE {
     ?person a :Person ;
             :name ?name;
             :age ?age ;
             :gender ?gender ;
             :friends ?friends ;
             :birthdate ?birthdate .
             FILTER (year(?birthdate) >= 1960) .
             FILTER regex(?name, \"^Ma\", \"i\") .
} 
LIMIT 2
")'
```

Query-2:
```sparql
dfx canister call relation_graph sparql_query '("tsv","
SELECT DISTINCT ?name ?age ?gender ?birthdate
WHERE {
    :P1 :friends ?friends1.
    ?friends1 :friends  ?friends2.
    ?friends2 :friends  ?friends3.
    ?friends3 a :Person ;
              :name ?name;
              :age ?age ;
              :gender \"Male\" ;
              :birthdate ?birthdate .
}
LIMIT 10
")'
```

Query-3:
```sparql
dfx canister call relation_graph sparql_query '("tsv","
SELECT DISTINCT ?name ?age ?gender ?birthdate
WHERE {
    :P1 :friends ?friends1.
    ?friends1 :friends  ?friends2.
    ?friends2 a :Person ;
              :name ?name;
              :age ?age ;
              :gender ?gender ;
              :birthdate ?birthdate .
}
LIMIT 10
")'
```

Query-4:
```sparql
dfx canister call relation_graph sparql_query '("tsv","
SELECT DISTINCT ?name ?age ?gender ?birthdate
WHERE {
    :P1 :friends ?friends1.
    ?friends1 a :Person ;
              :name ?name;
              :age ?age ;
              :gender ?gender ;
              :birthdate ?birthdate .
}
LIMIT 10
")'
```

#### Insert

Insert-1:
```sparql
dfx canister call relation_graph sparql_update '("  
INSERT DATA
{ 
    :P001 :name \"Luna\" ;
          :gender \"Female\" ;
          :age 35 ;
          :birthdate \"1989-10-14\"^^xsd:date ;
          :friends :P2, :P3 .
}
")'
```

Query-1: query the inserted person
```sparql
dfx canister call relation_graph sparql_query '("tsv","
SELECT ?name ?friends
WHERE {
    :P001 :name ?name;
          :age ?age ;
          :gender ?gender ;
          :friends ?friends ;
          :birthdate ?birthdate .
} 
")'
```

Query-2: query the inserted person's friends
```sparql
dfx canister call relation_graph sparql_query '("tsv","
SELECT DISTINCT ?friend ?friend_name
WHERE {
    :P001 :friends ?friend .
    ?friend :name ?friend_name
} 
")'
```

#### Update

Changes to existing triples are performed as a delete operation followed by an insert
operation in a single update request. The specification refers to this as `DELETE/INSERT`

Update-1: update age to 36 for person `P001`
```sparql
dfx canister call relation_graph sparql_update '("  
DELETE
{ :P001 :age ?o }
INSERT
{ :P001 :age 36 }
WHERE
{ :P001 :age ?o }
")'
```

Query-1: check update result
```sparql
dfx canister call relation_graph sparql_query '("tsv","
SELECT ?p ?o
WHERE { 
    :P001 ?p ?o .
}
")'
```

#### Deletion

Delete-1: delete all properties of a person `P001`
```sparql
dfx canister call relation_graph sparql_update '("  
DELETE WHERE
{
  :P001 ?p ?o .
}
")'
```

Delete-2: delete partial properties of a person
```sparql
dfx canister call relation_graph sparql_update '("
DELETE WHERE
{
:P001 :age ?age;
      :name ?name .
}
")'
```

Query-1: check deletion result
```sparql
dfx canister call relation_graph sparql_query '("tsv","
SELECT ?p ?o
WHERE { 
    :P001 ?p ?o .
}
")'
```
