import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/sequelize';
import { SongModel } from '../models/song.model';

@Injectable()
export class SpotifyService {
  private clientId: string;
  private clientSecret: string;

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
      this.httpService.post(
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

  async search(query: string): Promise<SongModel[]> {
    const accessToken = await this.getAccessToken();
    const response = await firstValueFrom(
      this.httpService.get(
        `https://api.spotify.com/v1/search?q=${query}&type=track&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      ),
    );

    const tracks = response.data.tracks.items;
    const savedSongs = await Promise.all(
      tracks.map(async (track: any) => {
        const [song] = await this.songModel.findOrCreate({
          where: { spotifyId: track.id },
          defaults: {
            title: track.name,
            artist: track.artists[0].name,
            platformId: track.id,
            spotifyId: track.id,
            duration: track.duration_ms / 1000,
            albumArtUrl: track.album.images[0].url,
          },
        });
        return song;
      }),
    );
    return savedSongs;
  }
}
