import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class SwapProgressesDto {
    @ApiProperty({
        description: "Id first progress",
        example: "1"
    })
    @IsString({message: "Должно быть строкой"})
    readonly progress1: number;

    @ApiProperty({
        description: "Id second progress",
        example: "2"
    })
    @IsNumber({}, {message: "Должно быть числом"})
    readonly progress2: number;
}