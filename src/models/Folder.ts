import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IFolder extends Document {
  publicId: string;
  name: string;
  color?: string; // e.g. blue, emerald, amber, purple, rose, slate
  createdAt: Date;
  updatedAt: Date;
}

const FolderSchema = new Schema<IFolder>(
  {
    publicId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      default: 'blue',
    },
  },
  {
    timestamps: true,
  }
);

const Folder: Model<IFolder> =
  mongoose.models.Folder || mongoose.model<IFolder>('Folder', FolderSchema);

export default Folder;
