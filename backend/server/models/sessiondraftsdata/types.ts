import { Document } from 'mongoose'

export interface ISESSIONDRAFTSDATA extends Document {
    sessionid: string,
    droppedElementsDocIdWise: object,
    emptyPagesAddedDocIdWise: object,
    allDocumentPagesViewports: object
}
