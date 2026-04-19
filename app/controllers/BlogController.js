const Blog = require("../models/Blog");

const handleBlogOperations = async (req, res) => {
  try {
    const { method, user } = req;
    const { id, action } = req.query; // action can be 'like', 'unlike', 'comment', 'approve'

    // --- HELPER: Identify Base Filters ---
    // Public: only published
    // User: only published
    // Writer: only author=id
    // Admin: all
    let readFilter = {};
    if (!user || user.role === "User") {
      readFilter = { status: "published" };
    } else if (user.role === "Writer") {
      readFilter = { author: user.id };
    } else if (user.role === "Admin") {
      readFilter = {};
    }

    // ================= GET REQUESTS (Read Operations) =================
    if (method === "GET") {
      if (id) {
        const blog = await Blog.findOne({ _id: id, ...readFilter })
          .populate("author", "name email")
          .populate("category", "name")
          .populate("comments.user", "name");
        if (!blog) return res.status(404).json({ success: false, message: "Blog not found or access denied" });
        return res.status(200).json({ success: true, count: 1, data: blog });
      } else {
        const blogs = await Blog.find(readFilter)
          .populate("author", "name")
          .populate("category", "name");
        return res.status(200).json({ success: true, count: blogs.length, data: blogs });
      }
    }

    // ================= POST REQUESTS (Create & Interactions) =================
    if (method === "POST") {
      if (!user) return res.status(403).json({ message: "Authentication required" });

      // Action: Like
      if (action === "like") {
         if (!id) return res.status(400).json({message: "Blog ID required in query for like"});
         const blog = await Blog.findById(id);
         if (!blog) return res.status(404).json({ message: "Blog not found" });
         
         if (blog.likes.includes(user.id)) return res.status(400).json({ message: "Already liked" });
         blog.likes.push(user.id);
         await blog.save();
         return res.status(200).json({ success: true, message: "Blog liked" });
      }

      // Action: Unlike
      if (action === "unlike") {
         if (!id) return res.status(400).json({message: "Blog ID required"});
         const blog = await Blog.findById(id);
         if (!blog) return res.status(404).json({ message: "Blog not found" });
         
         blog.likes = blog.likes.filter(u => u.toString() !== user.id);
         await blog.save();
         return res.status(200).json({ success: true, message: "Blog unliked" });
      }

      // Action: Comment
      if (action === "comment") {
         if (!id) return res.status(400).json({message: "Blog ID required"});
         const { text } = req.body;
         if (!text) return res.status(400).json({message: "Comment text required"});

         const blog = await Blog.findById(id);
         if (!blog) return res.status(404).json({ message: "Blog not found" });

         blog.comments.push({ user: user.id, text });
         await blog.save();
         return res.status(200).json({ success: true, message: "Comment added" });
      }

      // Default POST Action: Create new blog
      if (user.role === "User") return res.status(403).json({ message: "Users cannot create blogs" });
      
      const { title, content, category } = req.body;
      const image = req.file ? req.file.path : undefined;

      const newBlog = new Blog({
        title,
        content,
        image,
        category,
        author: user.id,
        status: user.role === "Admin" ? "published" : "pending" 
      });

      await newBlog.save();
      return res.status(201).json({ success: true, message: "Blog created successfully", data: newBlog });
    }

    // ================= PUT REQUESTS (Update Operations) =================
    if (method === "PUT") {
      if (!user) return res.status(403).json({ message: "Authentication required" });
      if (!id) return res.status(400).json({ message: "Blog ID is required" });
      
      const blog = await Blog.findById(id);
      if (!blog) return res.status(404).json({ message: "Blog not found" });

      if (user.role === "User" || (user.role === "Writer" && blog.author.toString() !== user.id)) {
         return res.status(403).json({ message: "Not authorized to update this blog" });
      }

      // Action: Approve Blog (Admin only)
      if (action === "approve") {
          if (user.role !== "Admin") return res.status(403).json({ message: "Only Admins can approve blogs" });
          blog.status = "published";
          await blog.save();
          return res.status(200).json({ success: true, message: "Blog approved and published" });
      }

      // General Update
      const { title, content, category, status } = req.body;
      if (title) blog.title = title;
      if (content) blog.content = content;
      if (category) blog.category = category;
      if (status && user.role === "Admin") blog.status = status; // only admin can manually set status
      if (req.file) blog.image = req.file.path;

      if (user.role === "Writer") blog.status = "pending"; // Re-updating puts it back to pending for writer

      await blog.save();
      return res.status(200).json({ success: true, message: "Blog updated", data: blog });
    }

    // ================= DELETE REQUESTS (Delete Operations) =================
    if (method === "DELETE") {
      if (!user) return res.status(403).json({ message: "Authentication required" });
      if (!id) return res.status(400).json({ message: "Blog ID is required" });

      const blog = await Blog.findById(id);
      if (!blog) return res.status(404).json({ message: "Blog not found" });

      if (user.role === "User" || (user.role === "Writer" && blog.author.toString() !== user.id)) {
        return res.status(403).json({ message: "Not authorized to delete this blog" });
      }

      await Blog.findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: "Blog deleted successfully" });
    }

    return res.status(405).json({ message: "Method not allowed on this endpoint" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  handleBlogOperations
};
