use std::io;

use ic_cdk::export::candid;
use ic_cdk::export::candid::types::ic_types::PrincipalError;
use thiserror::Error;

use relation_graph_core::sparql::{EvaluationError, ParseError};

pub type Result<T = ()> = std::result::Result<T, Error>;

#[derive(Debug, Error)]
pub enum Error {
    #[error("Store IO error: {0}")]
    StoreIO(#[from] io::Error),

    #[error("IC save error: {0}")]
    StoreICSave(#[from] candid::Error),

    #[error("IC restore error: {0}")]
    StoreICRestore(String),

    #[error("SPARQL query parse error: {0}")]
    SparqlQuery(#[from] ParseError),

    #[error("SPARQL query evaluation error: {0}")]
    SparqlEvaluation(#[from] EvaluationError),

    #[error("SPARQL template error: {0}")]
    SparqlTemplate(#[from] askama::Error),

    #[error("Principal error: {0}")]
    AclPrincipal(#[from] PrincipalError),

    #[error("Grant access error: {0}")]
    AclGrantAccess(String),

    #[error("Revoke access error: {0}")]
    AclRevokeAccess(String),
}
