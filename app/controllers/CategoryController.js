const Category = require("../models/Category");

const handleCategoryOperations = async (req, res) => {
  try {
    const { method, user } = req;
    const { id } = req.query;

    if (method === "GET") {
      // Allowed for all (public, writer, user, admin)
      if (id) {
        const category = await Category.findById(id);
        if (!category) return res.status(404).json({ message: "Category not found" });
        return res.status(200).json({ success: true, data: category });
      } else {
        const categories = await Category.find();
        return res.status(200).json({ success: true, count: categories.length, data: categories });
      }
    }

    // Only Admin can Create, Update, Delete
    if (!user || user.role !== "Admin") {
      return res.status(403).json({ message: "Only Admins can manage categories" });
    }

    if (method === "POST") {
      const { name, description } = req.body;
      const category = await Category.create({ name, description });
      return res.status(201).json({ success: true, message: "Category created", data: category });
    }

    if (method === "PUT") {
      if (!id) return res.status(400).json({ message: "Category ID required" });
      const category = await Category.findById(id);
      if (!category) return res.status(404).json({ message: "Category not found" });

      const { name, description } = req.body;
      if (name) category.name = name;
      if (description) category.description = description;

      await category.save();
      return res.status(200).json({ success: true, message: "Category updated", data: category });
    }

    if (method === "DELETE") {
      if (!id) return res.status(400).json({ message: "Category ID required" });
      const category = await Category.findByIdAndDelete(id);
      if (!category) return res.status(404).json({ message: "Category not found" });
      return res.status(200).json({ success: true, message: "Category deleted" });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: "Category name already exists" });
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  handleCategoryOperations
};
