
export class CommitResponseDto {
  success: boolean;
  summary: {
    inserted: number;
    updated: number;
    failed: number;
  };
  message: string;
}
