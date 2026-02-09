import React, { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { BookOpen, Plus, Edit, Trash2, X, Upload, User, Calendar, Hash, Building2 } from "lucide-react";

const ManageBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    category: "",
    description: "",
    coverImage: "",
    totalCopies: 1,
    isbn: "",
    publisher: "",
    publishedYear: "",
  });

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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, coverImage: reader.result });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error("Failed to upload image");
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBook) {
        await api.put(`/books/${editingBook._id}`, formData);
        toast.success("Book updated successfully");
      } else {
        await api.post("/books/add", formData);
        toast.success("Book added successfully");
      }
      setShowModal(false);
      resetForm();
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save book");
    }
  };

  const handleEdit = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      category: book.category,
      description: book.description || "",
      coverImage: book.coverImage || "",
      totalCopies: book.totalCopies,
      isbn: book.isbn || "",
      publisher: book.publisher || "",
      publishedYear: book.publishedYear || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (bookId) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;
    try {
      await api.delete(`/books/${bookId}`);
      toast.success("Book deleted successfully");
      fetchBooks();
    } catch (err) {
      toast.error("Failed to delete book");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      author: "",
      category: "",
      description: "",
      coverImage: "",
      totalCopies: 1,
      isbn: "",
      publisher: "",
      publishedYear: "",
    });
    setEditingBook(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Manage Books</h2>
          <p className="text-slate-500 font-medium">Add and manage library books</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all"
        >
          <Plus size={20} /> Add Book
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {books.map((book) => (
          <div key={book._id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div onClick={() => setSelectedBook(book)} className="cursor-pointer">
              {book.coverImage ? (
                <img src={book.coverImage} alt={book.title} className="w-full h-40 object-cover rounded-xl mb-3 hover:scale-105 transition-transform" />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl mb-3 flex items-center justify-center hover:scale-105 transition-transform">
                  <BookOpen size={48} className="text-indigo-400" />
                </div>
              )}
              <h3 className="font-black text-slate-800 mb-1 hover:text-indigo-600 transition-colors">{book.title}</h3>
              <p className="text-sm text-slate-600 mb-2">{book.author}</p>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600">
                {book.category}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {book.availableCopies}/{book.totalCopies} Available
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(book)}
                className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl font-bold hover:bg-blue-100 transition-all flex items-center justify-center gap-1"
              >
                <Edit size={16} /> Edit
              </button>
              <button
                onClick={() => handleDelete(book._id)}
                className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-1"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-slate-800">
                {editingBook ? "Edit Book" : "Add New Book"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Author *</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Category *</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Total Copies</label>
                  <input
                    type="number"
                    value={formData.totalCopies}
                    onChange={(e) => setFormData({ ...formData, totalCopies: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Cover Image</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center">
                  {formData.coverImage ? (
                    <div className="relative">
                      <img
                        src={formData.coverImage}
                        alt="Cover preview"
                        className="w-full h-48 object-cover rounded-xl mb-2"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, coverImage: "" })}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload size={32} className="mx-auto text-slate-400 mb-2" />
                      <p className="text-sm text-slate-600 mb-2">Click to upload cover image</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="cover-upload"
                      />
                      <label
                        htmlFor="cover-upload"
                        className="inline-block bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-bold cursor-pointer hover:bg-indigo-100"
                      >
                        {uploading ? "Uploading..." : "Choose Image"}
                      </label>
                      <p className="text-xs text-slate-400 mt-2">Max size: 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">ISBN</label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Publisher</label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Year</label>
                  <input
                    type="number"
                    value={formData.publishedYear}
                    onChange={(e) => setFormData({ ...formData, publishedYear: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                >
                  {editingBook ? "Update Book" : "Add Book"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              <div className="flex justify-center">
                {selectedBook.coverImage ? (
                  <img src={selectedBook.coverImage} alt={selectedBook.title} className="w-full max-w-sm h-64 object-cover rounded-2xl shadow-lg" />
                ) : (
                  <div className="w-full max-w-sm h-64 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-lg">
                    <BookOpen size={80} className="text-indigo-400" />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-3xl font-black text-slate-800 mb-2">{selectedBook.title}</h3>
                  <p className="text-lg text-slate-600 flex items-center gap-2">
                    <User size={18} />
                    {selectedBook.author}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 font-bold">{selectedBook.category}</span>
                  <span className={`px-4 py-2 rounded-xl font-bold ${selectedBook.availableCopies > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                    {selectedBook.availableCopies > 0 ? "Available" : "Out of Stock"}
                  </span>
                </div>

                {selectedBook.description && (
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-sm font-bold text-slate-500 mb-2">Description</p>
                    <p className="text-slate-700">{selectedBook.description}</p>
                  </div>
                )}

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

                <div className="flex gap-3 pt-4">
                  <button onClick={() => { setSelectedBook(null); handleEdit(selectedBook); }} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                    <Edit size={18} /> Edit Book
                  </button>
                  <button onClick={() => { setSelectedBook(null); handleDelete(selectedBook._id); }} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                    <Trash2 size={18} /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBooks;
