import { Document } from 'mongoose'

export interface IDOCUMENT extends Document {
  sessionid: string,
  nonEditedDocumentId: string,
  originalDocumentId: string,
  documentCategory: string,
  name: string,
  url: string,
  type: string,
  size: string,
  key: string,
  bucketName: string,
  uploadedBy: string,
  uploadedStage: string,
  preprocessing: string,
  originalDocumentKey: string,
  originalDocumentUrl: string,
  originalDocumentSize: string,
  deleted: boolean,
  deletedAt: Date,
  deletedBy: string
}
