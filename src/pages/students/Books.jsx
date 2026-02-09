import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { BookOpen, Search, User, X, Calendar, Hash, Building2 } from "lucide-react";

const Books = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await api.get("/books");
      setBooks(res.data.books || []);
    } catch (err) {
      console.error("Failed to fetch books:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase()) ||
      book.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-800">Library Books</h2>
        <p className="text-sm md:text-base text-slate-500 font-medium">Browse our collection</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl border border-slate-200">
        <Search size={20} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search by title, author, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 outline-none text-sm font-medium"
        />
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBooks.length > 0 ? (
          filteredBooks.map((book) => (
            <div
              key={book._id}
              onClick={() => setSelectedBook(book)}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
            >
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-48 object-cover rounded-xl mb-3"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl mb-3 flex items-center justify-center">
                  <BookOpen size={48} className="text-indigo-400" />
                </div>
              )}
              <h3 className="font-black text-slate-800 mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">{book.title}</h3>
              <p className="text-sm text-slate-600 mb-2 flex items-center gap-1">
                <User size={14} />
                {book.author}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600">
                  {book.category}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {book.availableCopies}/{book.totalCopies} Available
                </span>
              </div>
              {book.description && (
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">{book.description}</p>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <BookOpen size={64} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-400 font-bold">No books found</p>
          </div>
        )}
      </div>

      {/* Book Detail Modal */}
      {selectedBook && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedBook(null)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-2xl font-black text-slate-800">Book Details</h2>
              <button onClick={() => setSelectedBook(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={24} className="text-slate-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Cover Image */}
              <div className="flex justify-center">
                {selectedBook.coverImage ? (
                  <img
                    src={selectedBook.coverImage}
                    alt={selectedBook.title}
                    className="w-full max-w-sm h-64 object-cover rounded-2xl shadow-lg"
                  />
                ) : (
                  <div className="w-full max-w-sm h-64 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-lg">
                    <BookOpen size={80} className="text-indigo-400" />
                  </div>
                )}
              </div>

              {/* Book Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-3xl font-black text-slate-800 mb-2">{selectedBook.title}</h3>
                  <p className="text-lg text-slate-600 flex items-center gap-2">
                    <User size={18} />
                    {selectedBook.author}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 font-bold">
                    {selectedBook.category}
                  </span>
                  <span className={`px-4 py-2 rounded-xl font-bold ${
                    selectedBook.availableCopies > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  }`}>
                    {selectedBook.availableCopies > 0 ? "Available" : "Out of Stock"}
                  </span>
                </div>

                {selectedBook.description && (
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-sm font-bold text-slate-500 mb-2">Description</p>
                    <p className="text-slate-700">{selectedBook.description}</p>
                  </div>
                )}

                {/* Additional Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-bold text-slate-500 mb-1">Total Copies</p>
                    <p className="text-2xl font-black text-slate-800">{selectedBook.totalCopies}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-bold text-slate-500 mb-1">Available</p>
                    <p className="text-2xl font-black text-green-600">{selectedBook.availableCopies}</p>
                  </div>
                </div>

                {(selectedBook.isbn || selectedBook.publisher || selectedBook.publishedYear) && (
                  <div className="space-y-3 border-t border-slate-100 pt-4">
                    {selectedBook.isbn && (
                      <div className="flex items-center gap-3">
                        <Hash size={18} className="text-slate-400" />
                        <div>
                          <p className="text-xs font-bold text-slate-500">ISBN</p>
                          <p className="text-sm font-bold text-slate-700">{selectedBook.isbn}</p>
                        </div>
                      </div>
                    )}
                    {selectedBook.publisher && (
                      <div className="flex items-center gap-3">
                        <Building2 size={18} className="text-slate-400" />
                        <div>
                          <p className="text-xs font-bold text-slate-500">Publisher</p>
                          <p className="text-sm font-bold text-slate-700">{selectedBook.publisher}</p>
                        </div>
                      </div>
                    )}
                    {selectedBook.publishedYear && (
                      <div className="flex items-center gap-3">
                        <Calendar size={18} className="text-slate-400" />
                        <div>
                          <p className="text-xs font-bold text-slate-500">Published Year</p>
                          <p className="text-sm font-bold text-slate-700">{selectedBook.publishedYear}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Books;
