import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateProjectDto {
    @ApiProperty({
        description: "Name",
        example: "Trello"
    })
    @IsString({message: "Должно быть строкой"})
    readonly name: string;
}