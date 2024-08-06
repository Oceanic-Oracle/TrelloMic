import { IsString } from "class-validator";

export class CreateProjectDto {
    @IsString({message: "Должно быть строкой"})
    readonly name: string;
}