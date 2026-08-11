const mongoose = require("mongoose");
require("dotenv").config();

const CategoryModel = require("./models/Category.model");

const categories = [
  // =========================
  // EXPENSE CATEGORIES
  // =========================
  {
    name: "Food",
    type: "expense",
    icon: "FaUtensils",
    color: "#F97316",
  },
  {
    name: "Rent",
    type: "expense",
    icon: "FaHouse",
    color: "#EF4444",
  },
  {
    name: "Groceries",
    type: "expense",
    icon: "FaShoppingCart",
    color: "#22C55E",
  },
  {
    name: "Transport",
    type: "expense",
    icon: "FaCar",
    color: "#3B82F6",
  },
  {
    name: "Bills",
    type: "expense",
    icon: "FaFileInvoiceDollar",
    color: "#8B5CF6",
  },
  {
    name: "Shopping",
    type: "expense",
    icon: "FaBagShopping",
    color: "#EC4899",
  },
  {
    name: "Entertainment",
    type: "expense",
    icon: "FaFilm",
    color: "#A855F7",
  },
  {
    name: "Health",
    type: "expense",
    icon: "FaHeartPulse",
    color: "#EF4444",
  },
  {
    name: "Education",
    type: "expense",
    icon: "FaGraduationCap",
    color: "#0EA5E9",
  },
  {
    name: "Travel",
    type: "expense",
    icon: "FaPlane",
    color: "#14B8A6",
  },
  {
    name: "Other",
    type: "expense",
    icon: "FaTag",
    color: "#6366F1",
  },

  // =========================
  // INCOME CATEGORIES
  // =========================
  {
    name: "Salary",
    type: "income",
    icon: "FaMoneyBill",
    color: "#16A34A",
  },
  {
    name: "Freelance",
    type: "income",
    icon: "FaLaptopCode",
    color: "#2563EB",
  },
  {
    name: "Business",
    type: "income",
    icon: "FaBriefcase",
    color: "#7C3AED",
  },
  {
    name: "Investment",
    type: "income",
    icon: "FaChartLine",
    color: "#059669",
  },
  {
    name: "Gift",
    type: "income",
    icon: "FaGift",
    color: "#DB2777",
  },
  {
    name: "Other",
    type: "income",
    icon: "FaTag",
    color: "#6366F1",
  },
];

async function seedCategories() {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("MONGO_URI is missing from .env");
    }

    await mongoose.connect(mongoUri);

    let inserted = 0;
    let skipped = 0;

    for (const category of categories) {
      const existing = await CategoryModel.findOne({
        name: category.name,
        type: category.type,
        owner: null,
      });

      if (existing) {
        skipped++;
        continue;
      }

      await CategoryModel.create({
        ...category,
        owner: null,
        isSystemDefault: true,
      });

      inserted++;
    }

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error("CATEGORY SEED FAILED");
    console.error(error);

    await mongoose.disconnect().catch(() => {});

    process.exit(1);
  }
}

seedCategories();