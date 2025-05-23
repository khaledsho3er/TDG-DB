const Category = require("../models/category");
const SubCategory = require("../models/subCategory");
const Type = require("../models/types");
const upload = require("../middlewares/multerSetup");

exports.createCategory = async (req, res) => {
  try {
    console.log("Uploaded files:", req.files); // Debug uploaded files

    const { name, description } = req.body;
    const categoryImageName = req.files["image"]
      ? req.files["image"][0].key
      : null; // Store only the key (filename)

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

    const subCategoryImages = req.files["subCategoryImages"] || [];
    const typeImages = req.files["typeImages"] || [];
    console.log("Subcategory Images Uploaded:", subCategoryImages);
    console.log("Type Images Uploaded:", typeImages);

    // Map images to subcategories in order
    subCategories.forEach((subCategory, index) => {
      if (subCategoryImages[index]) {
        subCategory.image = subCategoryImages[index].key; // Store only the image key (filename)
      } else {
        subCategory.image = null; // No image uploaded
      }
    });

    console.log("Updated Subcategories with Images:", subCategories);

    const subCategoryIds = await Promise.all(
      subCategories.map(async (subCategory) => {
        console.log(
          "Processing Subcategory:",
          subCategory.name,
          "Image:",
          subCategory.image
        );

        const typeIds = await Promise.all(
          subCategory.types.map(async (type, typeIndex) => {
            const typeImageKey = typeImages[typeIndex]
              ? typeImages[typeIndex].key
              : null;

            const typeData = {
              name: type.name,
              description: type.description || "",
              image: typeImageKey, // Store only filename (Cloudflare key)
            };

            return await Type.create(typeData);
          })
        );

        const subCategoryData = {
          name: subCategory.name,
          description: subCategory.description || "",
          image: subCategory.image, // Store only filename (Cloudflare key)
          types: typeIds.map((type) => type._id),
        };

        return await SubCategory.create(subCategoryData);
      })
    );

    const category = await Category.create({
      name,
      description,
      image: categoryImageName,
      subCategories: subCategoryIds.map((sub) => sub._id),
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
    res.status(500).json({ message: "Error fetching categories", error });
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

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    console.log("Received Data:", req.body);
    console.log("Files Uploaded:", req.files);

    // ✅ تأكد من أن subCategories موجودة وهي مصفوفة، وإذا لم تكن، اجعلها مصفوفة فارغة []
    const subCategories = Array.isArray(req.body.subCategories)
      ? req.body.subCategories
      : JSON.parse(req.body.subCategories || "[]");

    if (!Array.isArray(subCategories)) {
      try {
        subCategories = JSON.parse(subCategories); // إذا كانت JSON String، حولها لمصفوفة
      } catch (error) {
        subCategories = []; // إذا فشل التحويل، اجعلها مصفوفة فارغة
      }
    }

    // ✅ معالجة الـ SubCategories وتحويلها من JSON إلى كائنات
    const parsedSubCategories = subCategories
      .map((subCat) => {
        try {
          return JSON.parse(subCat);
        } catch (error) {
          console.error("Error parsing subCategory:", subCat, error);
          return null;
        }
      })
      .filter((subCat) => subCat !== null);

    // ✅ تحديث صورة الفئة الرئيسية
    const categoryImage = req.files["image"]
      ? req.files["image"][0].filename
      : req.body.image;

    // ✅ تحديث الفئة الرئيسية
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name, description, image: categoryImage },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    // ✅ تحديث الـ SubCategories ومعالجة الأنواع
    const subCategoryUpdates = await Promise.all(
      parsedSubCategories.map(async (subCategory, index) => {
        let subCategoryImage =
          req.files["subCategoryImages"]?.[index]?.filename ||
          subCategory.image;

        if (subCategory._id) {
          const existingSubCategory = await SubCategory.findById(
            subCategory._id
          );
          if (!existingSubCategory) return null;

          const newTypes = await Promise.all(
            (subCategory.types || []).map(async (type) => {
              if (type._id) {
                return await Type.findByIdAndUpdate(
                  type._id,
                  { name: type.name },
                  { new: true }
                );
              } else {
                return await Type.create({ name: type.name });
              }
            })
          );

          return await SubCategory.findByIdAndUpdate(
            subCategory._id,
            {
              name: subCategory.name,
              description: subCategory.description,
              image: subCategoryImage,
              types: newTypes.map((type) => type._id),
            },
            { new: true }
          );
        } else {
          const createdTypes = await Type.insertMany(
            (subCategory.types || []).map((type) => ({ name: type.name }))
          );

          return await SubCategory.create({
            name: subCategory.name,
            description: subCategory.description || "",
            image: subCategoryImage,
            types: createdTypes.map((type) => type._id),
            category: id, // ✅ إضافة الفئة إلى السوبكاتيجوري
          });
        }
      })
    );

    // ✅ ربط subCategories بالكاتيجوري
    updatedCategory.subCategories = subCategoryUpdates
      .filter((sub) => sub !== null)
      .map((sub) => sub._id);
    await updatedCategory.save();

    res.status(200).json({
      message: "Category, SubCategories, and Types updated successfully",
      category: updatedCategory,
      subCategories: subCategoryUpdates.filter((sub) => sub !== null),
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      message: "Error updating category",
      error: error.message,
    });
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
