export interface EditVersionResponseDTO {
  editSessionId: number;
  editVersionId: number;
  versionIndex: number;
  s3Key: string;
  imageUrl: string;
  sourceType: string;
}
