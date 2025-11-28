import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const userSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email, password, name } = userSchema.parse(body)

        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { user: null, message: "User with this email already exists" },
                { status: 409 }
            )
        }

        const hashedPassword = await hash(password, 10)
        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword
            }
        })

        const { password: newUserPassword, ...rest } = newUser

        return NextResponse.json(
            { user: rest, message: "User created successfully" },
            { status: 201 }
        )
    } catch (error) {
        return NextResponse.json(
            { user: null, message: "Something went wrong" },
            { status: 500 }
        )
    }
}
