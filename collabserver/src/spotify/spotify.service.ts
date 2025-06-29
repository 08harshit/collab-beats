import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/sequelize';
import { SongModel } from '../models/song.model';

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  duration_ms: number;
  album: {
    images: { url: string }[];
  };
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
  };
}

@Injectable()
export class SpotifyService {
  private clientId: string;
  private clientSecret: string;
  private readonly logger = new Logger(SpotifyService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectModel(SongModel)
    private songModel: typeof SongModel,
  ) {
    const clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'SPOTIFY_CLIENT_SECRET',
    );

    if (!clientId || !clientSecret) {
      this.logger.error(
        'Spotify credentials not found in environment variables.',
      );
      throw new UnauthorizedException('Spotify credentials not found.');
    }

    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
      'base64',
    );
    const response = await firstValueFrom(
      this.httpService.post<SpotifyTokenResponse>(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${auth}`,
          },
        },
      ),
    );
    return response.data.access_token;
  }

  async search(query: string): Promise<any[]> {
    const accessToken = await this.getAccessToken();
    const response = await firstValueFrom(
      this.httpService.get<SpotifySearchResponse>(
        `https://api.spotify.com/v1/search?q=${query}&type=track&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      ),
    );

    const tracks: SpotifyTrack[] = response.data.tracks.items;
    return tracks.map((track: SpotifyTrack) => ({
      id: track.id,
      title: track.name,
      artist: track.artists[0].name,
      platformId: track.id,
      spotifyId: track.id,
      duration: track.duration_ms / 1000,
      albumArtUrl: track.album.images[0]?.url || '',
    }));
  }
}
