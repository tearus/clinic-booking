import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { verifyPassword } from './password';

const DUMMY_HASH = `${'00'.repeat(16)}:${'00'.repeat(64)}`;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    const passwordOk = await verifyPassword(
      password,
      user?.passwordHash ?? DUMMY_HASH,
    );
    if (!user || !passwordOk) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const accessToken = await this.jwt.signAsync({
      sub: String(user.id),
      role: user.role,
    });
    return { accessToken };
  }
}
