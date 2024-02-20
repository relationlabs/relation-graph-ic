use std::str::FromStr;

use askama::Template;
use ic_cdk::export::Principal;
use strum::{EnumString, IntoStaticStr};

use relation_graph_core::model::Term;
use relation_graph_core::sparql::{QueryResults, QuerySolution};

use crate::{db, error::{Error, Result}};

const UID_PREFIX: &str = "u_";
const ACL_PROP_ID: &str = "id";
const ACL_PROP_ROLE: &str = "role";
const ACL_SHOW_LIMIT_DEFAULT: usize = 100;

/// The role of the ACL user
#[derive(Clone, Debug, PartialEq, IntoStaticStr, EnumString)]
#[strum(serialize_all = "kebab_case")]
enum Role {
    Admin,
    User,
}

impl Role {
    fn is_admin(&self) -> bool {
        matches!(*self, Role::Admin)
    }
}

/// init with admin
pub(crate) fn init(admin: Principal) -> Result {
    grant_access(admin, Role::Admin.into())
}

/// show acls with limit
/// result e.g. [(id1,role1), (id2,role2), ...]
pub(crate) fn show_acls(limit: usize) -> Result<Vec<(Option<String>, Option<String>)>> {
    let limit = if limit == 0 { ACL_SHOW_LIMIT_DEFAULT } else { limit };
    let template = templates::AclShow { limit };
    let sparql = to_sparql(template)?;
    Ok(if let Ok(QueryResults::Solutions(iter)) = db::sparql_raw_query(&sparql) {
        iter.map(|result| {
            result.as_ref().map(|solution| {
                let id = extract_literal_value(solution, ACL_PROP_ID);
                let role = extract_literal_value(solution, ACL_PROP_ROLE);
                (id, role)
            }).unwrap_or_default()
        }).collect::<Vec<_>>()
    } else {
        vec![]
    })
}

/// check if the id is admin
pub(crate) fn is_admin(id: &Principal) -> Result<bool> {
    let template = templates::AclQueryById { uid: &uid_for(id) };
    let sparql = to_sparql(template)?;
    Ok(if let Ok(QueryResults::Solutions(mut iter)) = db::sparql_raw_query(&sparql) {
        iter.any(|result| {
            result.as_ref().map(|solution| {
                if let Some(Term::Literal(role)) = solution.get(ACL_PROP_ROLE) {
                    let role: Role = Role::from_str(role.value()).unwrap_or(Role::User);
                    role.is_admin()
                } else {
                    false
                }
            }).unwrap_or_default()
        })
    } else {
        false
    })
}

/// check if access allowed for the given id
pub(crate) fn is_access_allowed(id: &Principal) -> Result<bool> {
    let template = templates::AclExists { uid: &uid_for(id) };
    let sparql = to_sparql(template)?;
    Ok(if let Ok(QueryResults::Boolean(exists)) = db::sparql_raw_query(&sparql) {
        exists
    } else {
        false
    })
}

/// grant access to the id with the given role
pub(crate) fn grant_access(id: Principal, role: &str) -> Result {
    let role = Role::from_str(role).unwrap_or(Role::User).into();
    let template = templates::AclInsert {
        uid: &uid_for(&id),
        id: &id.to_string(),
        role,
    };
    let sparql = to_sparql(template)?;
    db::sparql_update(&sparql).map_err(|e| Error::AclGrantAccess(e.to_string()))
}

/// revoke access to the id
pub(crate) fn revoke_access(id: &Principal) -> Result {
    let template = templates::AclDelete { uid: &uid_for(id) };
    let sparql = to_sparql(template)?;
    db::sparql_update(&sparql).map_err(|e| Error::AclRevokeAccess(e.to_string()))
}

fn to_sparql<T: Template>(template: T) -> Result<String> {
    let tpl = template.render().map_err(Error::from)?;
    ic_cdk::print(format!("\n{}", tpl));
    Ok(tpl)
}

fn uid_for(id: &Principal) -> String {
    format!("{}{}", UID_PREFIX, id.to_string())
}

fn extract_literal_value(solution: &QuerySolution, prop: &str) -> Option<String> {
    if let Some(Term::Literal(v)) = solution.get(prop) {
        Some(v.value().to_string())
    } else {
        None
    }
}

/// SPARQL templates used by ACL
pub(in crate::acl) mod templates {
    use askama::Template;

    #[derive(Template, Debug)]
    #[template(path = "sparql/acl_show.rq", escape = "none")]
    pub struct AclShow {
        pub limit: usize,
    }

    #[derive(Template, Debug)]
    #[template(path = "sparql/acl_insert.rq", escape = "none")]
    pub struct AclInsert<'a> {
        pub uid: &'a str,
        pub id: &'a str,
        pub role: &'a str,
    }

    #[derive(Template, Debug)]
    #[template(path = "sparql/acl_query_by_id.rq", escape = "none")]
    pub struct AclQueryById<'a> {
        pub uid: &'a str,
    }

    #[derive(Template, Debug)]
    #[template(path = "sparql/acl_exists.rq", escape = "none")]
    pub struct AclExists<'a> {
        pub uid: &'a str,
    }

    #[derive(Template, Debug)]
    #[template(path = "sparql/acl_delete.rq", escape = "none")]
    pub struct AclDelete<'a> {
        pub uid: &'a str,
    }
}
