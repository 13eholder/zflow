pub fn read_file(path: &std::path::Path) -> std::io::Result<Vec<u8>> {
    std::fs::read(path).map_err(|_| std::io::Error::from(std::io::ErrorKind::NotFound))
}
