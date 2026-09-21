import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPDF extends Document {
  publicId: string;
  title: string;
  originalFileName: string;
  storageKey: string;
  storageUrl: string;
  fileSize: number;
  mimeType: string;
  pageCount?: number;
  views: number;
  status: 'active' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

const PDFSchema = new Schema<IPDF>(
  {
    publicId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
    },
    storageUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      default: 'application/pdf',
    },
    pageCount: {
      type: Number,
    },
    views: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'deleted'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation of model in Next.js development
const PDF: Model<IPDF> = mongoose.models.PDF || mongoose.model<IPDF>('PDF', PDFSchema);

export default PDF;
