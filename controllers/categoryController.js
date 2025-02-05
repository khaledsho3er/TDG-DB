// const Category = require("../models/category");

// exports.createCategory = async (req, res) => {
//   try {
//     const { name, description } = req.body;
//     const image = req.file ? `/uploads/${req.file.filename}` : null;

//     if (!name) {
//       return res.status(400).json({ message: "Name is required" });
//     }

//     const category = new Category({ name, description, image });
//     await category.save();
//     res
//       .status(201)
//       .json({ message: "Category created successfully", category });
//   } catch (error) {
//     res.status(500).json({ message: "Error creating category", error });
//   }
// };

// exports.getCategories = async (req, res) => {
//   try {
//     const categories = await Category.find();
//     res.status(200).json(categories);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching categories", error });
//     console.log("Error fetching categories:", error);
//   }
// };

// exports.updateCategory = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, description } = req.body;
//     const image = req.file ? `/uploads/${req.file.filename}` : null;

//     const updatedCategory = await Category.findByIdAndUpdate(
//       id,
//       { name, description, image },
//       { new: true }
//     );

//     res.status(200).json({ message: "Category updated", updatedCategory });
//   } catch (error) {
//     res.status(500).json({ message: "Error updating category", error });
//   }
// };

// exports.deleteCategory = async (req, res) => {
//   try {
//     const { id } = req.params;
//     await Category.findByIdAndDelete(id);
//     res.status(200).json({ message: "Category deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Error deleting category", error });
//   }
// };
const Category = require("../models/category");
const SubCategory = require("../models/subCategory");
const Type = require("../models/types");
// // Create Category with Subcategories and Types
// exports.createCategory = async (req, res) => {
//   try {
//     const { name, description, image, subCategories } = req.body;

//     // Create the category
//     const category = new Category({ name, description, image });
//     const savedCategory = await category.save();

//     // Create SubCategories and Types
//     if (subCategories && subCategories.length > 0) {
//       await Promise.all(
//         subCategories.map(async (subCategory) => {
//           const newSubCategory = new SubCategory({
//             name: subCategory.name,
//             description: subCategory.description,
//             image: subCategory.image,
//             categoryId: savedCategory._id,
//           });
//           const savedSubCategory = await newSubCategory.save();

//           if (subCategory.types && subCategory.types.length > 0) {
//             await Promise.all(
//               subCategory.types.map(async (type) => {
//                 const newType = new Type({
//                   name: type.name,
//                   description: type.description,
//                   subCategoryId: savedSubCategory._id,
//                 });
//                 await newType.save();
//               })
//             );
//           }
//         })
//       );
//     }

//     res.status(201).json({
//       message: "Category, SubCategories, and Types created successfully",
//       category: savedCategory,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error creating category", error: error.message });
//   }
// };
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const categoryImage = req.file ? req.file.filename : null;

    console.log("Received Data:", req.body); // Debugging
    console.log("Files Uploaded:", req.files); // Debugging

    let subCategories = [];
    if (req.body.subCategories) {
      try {
        subCategories = JSON.parse(req.body.subCategories);
      } catch (error) {
        return res
          .status(400)
          .json({ message: "Invalid subCategories format" });
      }
    }

    console.log("Parsed Subcategories:", subCategories);

    const subCategoryIds = await Promise.all(
      subCategories.map(async (subCategory, index) => {
        const createdTypes = await Type.insertMany(
          subCategory.types.map((typeName) => ({ name: typeName }))
        );

        const subCategoryImage =
          req.files?.subCategoryImages?.[index]?.filename || null;

        const createdSubCategory = await SubCategory.create({
          name: subCategory.name,
          description: subCategory.description || "",
          image: subCategoryImage,
          types: createdTypes.map((type) => type._id),
        });

        return createdSubCategory._id;
      })
    );

    const category = await Category.create({
      name,
      description,
      image: categoryImage,
      subCategories: subCategoryIds,
    });

    res
      .status(201)
      .json({ message: "Category created successfully", category });
  } catch (error) {
    console.error("Error creating category:", error);
    res
      .status(500)
      .json({ message: "Error creating category", error: error.message });
  }
};

// Get All Categories with SubCategories and Types
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .populate({
        path: "subCategories",
        populate: {
          path: "types", // Nested population
        },
      })
      .exec();

    res.status(200).json(categories);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching categories", error: error.message });
  }
};

// Get a Single Category by ID with SubCategories and Types
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params; // Get the category ID from the URL params

    // Fetch category by ID, populate subCategories and types
    const category = await Category.findById(id)
      .populate({
        path: "subCategories",
        populate: {
          path: "types",
        },
      })
      .exec();

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json(category); // Return the category data
  } catch (error) {
    console.error("Error fetching category:", error);
    res
      .status(500)
      .json({ message: "Error fetching category", error: error.message });
  }
};

// Update Category, SubCategories, and Types
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const parsedSubCategories = JSON.parse(req.body.subCategories || "[]");

    // Handle image update (if an image file is uploaded)
    const image = req.file ? req.file.filename : req.body.image;

    // Update the category
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name, description, image },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Update SubCategories and Types
    await Promise.all(
      parsedSubCategories.map(async (subCategory) => {
        if (subCategory._id) {
          const updatedSubCategory = await SubCategory.findByIdAndUpdate(
            subCategory._id,
            {
              name: subCategory.name,
              description: subCategory.description,
              image: subCategory.image,
            },
            { new: true }
          );

          if (subCategory.types && subCategory.types.length > 0) {
            await Promise.all(
              subCategory.types.map(async (type) => {
                if (typeof type === "object" && type._id) {
                  await Type.findByIdAndUpdate(type._id, { name: type.name });
                }
              })
            );
          }
        }
      })
    );

    res.status(200).json({
      message: "Category, SubCategories, and Types updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating category", error: error.message });
  }
};

// Delete Category and its SubCategories and Types
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete all SubCategories and Types linked to the category
    const subCategories = await SubCategory.find({ categoryId: id });
    await Promise.all(
      subCategories.map(async (subCategory) => {
        await Type.deleteMany({ subCategoryId: subCategory._id });
        await subCategory.remove();
      })
    );

    // Delete the category
    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res
      .status(200)
      .json({ message: "Category and its related data deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting category", error: error.message });
  }
};
