import { IsString } from "class-validator";

export class CreateTaskDto {
    @IsString({message: "Должно быть строкой"})
    readonly name: string;
    
    @IsString({message: "Должно быть строкой"})
    readonly text: string;
}