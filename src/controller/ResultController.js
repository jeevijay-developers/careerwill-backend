exports.searchResults = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
        return res.status(400).json({ message: "Search query is required" });
        }
    
        // Search by studentName, rollNo, testDate, and batch
        const results = await Result.find({
        $or: [
            { studentName: new RegExp(query, 'i') },
            { rollNo: new RegExp(query, 'i') },
            { testDate: new RegExp(query, 'i') },
            { batch: new RegExp(query, 'i') }
        ]
        });
    
        if (results.length === 0) {
        return res.status(404).json({ message: "No results found" });
        }
    
        res.status(200).json(results);
    } catch (err) {
        console.error("Error searching results:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}