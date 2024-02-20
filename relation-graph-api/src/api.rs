use std::str::FromStr;

use ic_cdk::export::{candid::Nat, Principal};
use ic_cdk_macros::*;
use num_traits::ToPrimitive;

use crate::{acl, db};

const MESSAGE_SUCCESS: &str = "SUCCESS";
const MESSAGE_ACCESS_DENIED: &str = "ACCESS_DENIED";
const MESSAGE_REVOKE_FORBIDDEN: &str = "REVOKE_FORBIDDEN";

#[init]
fn init_graphdb() {
    match db::init() {
        Ok(_) => {
            let admin = ic_cdk::caller();
            ic_cdk::print(format!("ACL initialized admin: {}, canister_id: {}", admin.to_string(), ic_cdk::id()));
            acl::init(admin).expect("failed to init acl admin");
            ic_cdk::print("GraphDB initialized SUCCESS")
        }
        Err(e) => ic_cdk::print(format!("GraphDB initialized FAILURE: {:?}", e)),
    }
}

#[pre_upgrade]
fn pre_upgrade_graphdb() {
    match db::take_snapshot() {
        Ok(_) => ic_cdk::print("GraphDB pre_upgrade SUCCESS"),
        Err(e) => ic_cdk::print(format!("GraphDB pre_upgrade FAILURE: {:?}", e)),
    }
}

#[post_upgrade]
fn post_upgrade_graphdb() {
    match db::restore_snapshot() {
        Ok(_) => ic_cdk::print("GraphDB post_upgrade SUCCESS"),
        Err(e) => ic_cdk::print(format!("GraphDB post_upgrade FAILURE: {:?}", e)),
    }
}

#[query(guard = "is_access_allowed")]
async fn sparql_query(result_format: String, query: String) -> String {
    match db::sparql_query(&result_format, &query) {
        Ok(result) => result,
        Err(e) => format!("GraphDB sparql_query FAILURE: {:?}", e),
    }
}

#[update(guard = "is_access_allowed")]
async fn sparql_update(update: String) -> String {
    match db::sparql_update(&update) {
        Ok(_) => MESSAGE_SUCCESS.into(),
        Err(e) => format!("GraphDB sparql_query FAILURE: {:?}", e),
    }
}

#[query(guard = "is_admin")]
async fn acl_show(limit: Nat) -> String {
    let limit = limit.0.to_usize().unwrap_or_default();
    match acl::show_acls(limit) {
        Ok(acls) => {
            let s = acls.iter().map(|(id, role)| {
                let id = id.as_ref().map(String::as_str).unwrap_or_default();
                let role = role.as_ref().map(String::as_str).unwrap_or_default();
                format!("{}\t{}", id, role)
            }).collect::<Vec<_>>();
            s.join("\n")
        }
        Err(e) => e.to_string(),
    }
}

#[update(guard = "is_admin")]
async fn acl_grant(id: String, role: String) -> String {
    match Principal::from_str(&id) {
        Ok(id) => {
            match acl::grant_access(id, &role) {
                Ok(_) => MESSAGE_SUCCESS.into(),
                Err(e) => e.to_string(),
            }
        }
        Err(e) => e.to_string(),
    }
}

#[update(guard = "is_admin")]
async fn acl_revoke(id: String) -> String {
    match Principal::from_str(&id) {
        Ok(id) => {
            // forbid to revoke yourself
            let caller = ic_cdk::caller();
            if id == caller {
                return MESSAGE_REVOKE_FORBIDDEN.into();
            }
            match acl::revoke_access(&id) {
                Ok(_) => MESSAGE_SUCCESS.into(),
                Err(e) => e.to_string(),
            }
        }
        Err(e) => e.to_string(),
    }
}

/// Check if the caller is an ACL granted user.
fn is_access_allowed() -> Result<(), String> {
    let caller = ic_cdk::caller();
    ic_cdk::print(format!("caller: {}", &caller.to_string()));
    if acl::is_access_allowed(&caller).unwrap_or_default() {
        Ok(())
    } else {
        Err(MESSAGE_ACCESS_DENIED.into())
    }
}

/// Check if the caller is a admin.
fn is_admin() -> Result<(), String> {
    let caller = ic_cdk::caller();
    ic_cdk::print(format!("caller: {}", &caller.to_string()));
    if acl::is_admin(&caller).unwrap_or_default() {
        Ok(())
    } else {
        Err(MESSAGE_ACCESS_DENIED.into())
    }
}