import mongoose, { Schema } from 'mongoose'
import { IDOCUMENT } from './types'
const ObjectId = mongoose.Schema.Types.ObjectId

export const DocumentSchema: Schema<IDOCUMENT> = new mongoose.Schema(
  {
    sessionid: {
      type: ObjectId,
      ref: 'Newsessiondata'
    },
    nonEditedDocumentId: {
      type: ObjectId,
      ref: 'Documentsdata'
    },
    originalDocumentId: {
      type: ObjectId,
      ref: 'Documentsdata'
    },
    documentCategory: {
      type: String,
      enum: ['initial_document', 'initial_document_backup', 'initial_document_old', 'final_document', 'final_document_with_extra_pdf', 'video_recording_file', 'final_document_with_dc', 'temp_video_recording_file', 'followup_document']
    },
    name: String,
    url: String,
    type: String,
    size: String,
    key: String,
    bucketName: String,
    uploadedBy: {
      type: ObjectId,
      ref: 'User'
    },
    uploadedStage: {
      type: String,
      enum: ['initial_stage', 'identity_check_stage', 'payment_info_stage', 'meet_notary_stage', 'document_with_dc']
    },
    preprocessing: {
      type: String,
      enum: ['pending', 'started', 'completed', 'failed']
    },
    originalDocumentKey: String,
    originalDocumentUrl: String,
    originalDocumentSize: String,
    deleted: Boolean,
    deletedAt: Date,
    deletedBy: {
      type: ObjectId,
      ref: 'User'
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)
export const DocumentModel = mongoose.model<IDOCUMENT>('documentsdata', DocumentSchema);
