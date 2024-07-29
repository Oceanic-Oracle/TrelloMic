import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateTaskDto {
    @ApiProperty({
        description: "Name task",
        example: "Create DB"
    })
    @IsString({message: "Должно быть строкой"})
    readonly name: string;

    @ApiProperty({
        description: "Description",
        example: "DB in Postgres"
    })
    @IsString({message: "Должно быть строкой"})
    readonly text: string;
}