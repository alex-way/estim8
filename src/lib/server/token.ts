import { JWT_SECRET_KEY } from "$env/static/private";
import { SignJWT, jwtVerify } from "jose";

type JWTPayload = {
	sub: string;
};

export const signJWT = async (payload: JWTPayload, options: { exp: Date }) => {
	const secret = new TextEncoder().encode(JWT_SECRET_KEY);

	return new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setExpirationTime(options.exp)
		.setIssuedAt()
		.setSubject(payload.sub)
		.sign(secret);
};

export const verifyJWT = async (token: string): Promise<JWTPayload> => {
	try {
		const secret = new TextEncoder().encode(JWT_SECRET_KEY);
		const { payload } = await jwtVerify<JWTPayload>(token, secret);
		return payload;
	} catch (error) {
		console.error(error);
		throw new Error("Your token has expired.");
	}
};
