import mongoose, { Document, Model } from "mongoose";

export interface IListing extends Document {
  source: string;
  title: string;
  price: number;
  rooms: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: string;
  garage?: boolean;
  keller?: boolean;
  city: string;
  area: number;
  furnished: boolean;
  petsAllowed: boolean;
  balcony: boolean;
  parking: boolean;
  kitchen: boolean;
  garden: boolean;
  lift: boolean;
  url: string;
  date: Date;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

const ListingSchema = new mongoose.Schema<IListing>(
  {
    source: { type: String, required: true },
    title: { type: String, required: true },
    price: { type: Number, index: true },
    rooms: { type: Number, index: true },
    bedrooms: { type: Number, index: true },
    bathrooms: { type: Number, index: true },
    floor: { type: String, index: true },
    garage: Boolean,
    keller: Boolean,
    city: { type: String, required: true, index: true },
    area: { type: Number, index: true },
    furnished: Boolean,
    petsAllowed: Boolean,
    balcony: Boolean,
    parking: Boolean,
    kitchen: Boolean,
    garden: Boolean,
    lift: Boolean,
    url: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now, index: true },
    image: String,
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Prevent model overwrite in development
const Listing: Model<IListing> = mongoose.models.Listing || mongoose.model<IListing>("Listing", ListingSchema);

export default Listing;
