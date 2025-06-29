/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import UserModel from '../models/user.model';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Provider } from '../models/interfaces';
import { UserAuthModel } from '../models/user-auth.model';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserModel)
    private userModel: typeof UserModel,
    @InjectModel(UserAuthModel)
    private userAuthModel: typeof UserAuthModel,
    private readonly httpService: HttpService,
  ) {}

  async findAll(): Promise<UserModel[]> {
    return this.userModel.findAll();
  }

  async create(userData: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }) {
    try {
      // Fetch user data from Spotify
      const spotifyUser = await firstValueFrom(
        this.httpService.get('https://api.spotify.com/v1/me', {
          headers: {
            Authorization: `Bearer ${userData.access_token}`,
          },
        }),
      );

      // Create or update user
      const [user, created] = await this.userModel.findOrCreate({
        where: {
          providerId: spotifyUser.data.id,
          provider: Provider.SPOTIFY,
        },
        defaults: {
          name: spotifyUser.data.display_name,
          email: spotifyUser.data.email,

          avatarUrl: spotifyUser.data.images?.[0]?.url,
          provider: Provider.SPOTIFY,
          providerId: spotifyUser.data.id,
        },
      });

      // Calculate token expiry
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + userData.expires_in);

      // Create or update auth data
      const [userAuth, authCreated] = await this.userAuthModel.findOrCreate({
        where: { userId: user.id },
        defaults: {
          userId: user.id,
          accessToken: userData.access_token,
          refreshToken: userData.refresh_token,
          accessTokenExpiresAt: expiryDate,
        },
      });

      if (!authCreated) {
        // Update the existing auth data
        await userAuth.update({
          accessToken: userData.access_token,
          refreshToken: userData.refresh_token,
          accessTokenExpiresAt: expiryDate,
        });
      }

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUsersStatus(spotifyUserId: string) {
    if (!spotifyUserId) {
      throw new Error('Spotify User ID is required');
    }

    const user = await this.userModel.findOne({
      where: {
        providerId: spotifyUserId,
        provider: Provider.SPOTIFY,
      },
      include: [
        {
          model: this.userAuthModel,
          required: true,
        },
      ],
    });

    if (!user || !user.authData) {
      throw new Error('User or auth details not found');
    }

    const currentTime = new Date();
    const accessTokenExpiresAt = new Date(user.authData.accessTokenExpiresAt);
    const isTokenExpired = currentTime >= accessTokenExpiresAt;

    return {
      status: isTokenExpired ? 'expired' : 'valid',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        spotifyId: user.providerId,
        spotifyEmail: user.email,
        accessToken: user.authData.accessToken,
        refreshToken: user.authData.refreshToken,
      },
    };
  }
}
