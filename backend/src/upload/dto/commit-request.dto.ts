import { IsNotEmpty, IsString } from 'class-validator';


export class CommitRequestDto {
  @IsNotEmpty({ message: 'El token de preview es requerido' })
  @IsString()
  previewToken: string;
}
