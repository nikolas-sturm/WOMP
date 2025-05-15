set quiet

lib := "crates/womp"
cli := "crates/womp_cli"
gui := "crates/womp_gui"

alias b := build
alias br := build_release
alias c := check
alias f := format
alias r := run
alias rc := run_womp_cli
alias rg := run_womp_gui

run repo +command:
    if [[ "{{repo}}" == "lib" ]]; then \
        cd {{lib}} && {{command}}; \
    elif [[ "{{repo}}" == "cli" ]]; then \
        cd {{cli}} && {{command}}; \
    elif [[ "{{repo}}" == "gui" ]]; then \
        cd {{gui}} && {{command}}; \
    fi

check:
    cargo check --all

format:
    cargo fmt --all

build:
    cargo build --package womp --package womp_cli
    just build_gui

build_gui:
    cd {{gui}} && npm run tauri build

build_release:
    cargo build --release --package womp --package womp_cli
    just build_gui_release

build_gui_release:
    cd {{gui}} && npm run tauri build

run_womp_cli *args:
    cargo run --package womp_cli -- {{args}}

run_womp_gui:
    cd {{gui}} && npm run tauri dev