import mongoose from "mongoose";

const ListingSchema = new mongoose.Schema({
  source: String,
  title: String,
  price: Number,
  rooms: Number,
  city: String,
  area: Number,
  furnished: Boolean,
  petsAllowed: Boolean,
  balcony: Boolean,
  parking: Boolean,
  kitchen: Boolean,
  garden: Boolean,
  lift: Boolean,
  url: String,
  date: Date,
  image: String,
});

export default mongoose.models.Listing || mongoose.model("Listing", ListingSchema);