#!/usr/bin/env bash
set -e

target="wasm32-unknown-unknown"

package="$1"
crate_name="$2"
output_name=${crate_name:-$package}

root="$(dirname "$0")"
package_root=${root}/${package}
release_root=${root}/target/${target}/release

# build wasm
# e.g. cargo build --target wasm32-unknown-unknown --package hello --release
cargo build --manifest-path="${package_root}/Cargo.toml" \
    --target ${target} \
    --release \
    --package ${package}

# optimize wasm binary
ic-wasm ${release_root}/${output_name}.wasm -o ${release_root}/${package}-opt.wasm optimize O3
