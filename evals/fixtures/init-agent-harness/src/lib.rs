pub mod storage;

pub fn load(path: &std::path::Path) -> std::io::Result<Vec<u8>> {
    storage::read_file(path)
}
