set quiet

womp_path := "crates/womp"
womp_cli_path := "crates/womp_cli"
womp_gui_path := "crates/womp_gui"

alias b := build
alias br := build_release
alias c := check
alias f := format
alias rc := run_womp_cli
alias rg := run_womp_gui

check:
    cargo check --all

format:
    cargo fmt --all

build:
    cargo build --package womp --package womp_cli
    just build_gui

build_gui:
    cd {{womp_gui_path}} && cargo tauri build

build_release:
    cargo build --release --package womp --package womp_cli
    just build_gui_release

build_gui_release:
    cd {{womp_gui_path}} && cargo tauri build

run_womp_cli *args:
    cargo run --package womp_cli -- {{args}}

run_womp_gui:
    cd {{womp_gui_path}} && cargo tauri dev