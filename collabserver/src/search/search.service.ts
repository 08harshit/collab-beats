import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyArtist {
  id: string;
  name: string;
}

interface SpotifyAlbum {
  id: string;
  name: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  preview_url: string | null;
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
  };
}

export interface SearchResult {
  tracks: {
    items: Array<{
      id: string;
      name: string;
      artist: string;
      album: {
        name: string;
        images: Array<{
          url: string;
          height: number;
          width: number;
        }>;
      };
      duration_ms: number;
      preview_url: string | null;
    }>;
    total: number;
  };
}

@Injectable()
export class SearchService {
  private readonly spotifyApiUrl = 'https://api.spotify.com/v1';
  private readonly clientId = '8dfee658cf304fe1b8212fac460b8cbe';
  private readonly clientSecret = 'cd747c32ede149dfa0b8ddfe58ada4b1';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private async getSpotifyAccessToken(): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<SpotifyTokenResponse>(
          'https://accounts.spotify.com/api/token',
          new URLSearchParams({
            grant_type: 'client_credentials',
          }).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${Buffer.from(
                `${this.clientId}:${this.clientSecret}`,
              ).toString('base64')}`,
            },
          },
        ),
      );

      return response.data.access_token;
    } catch (error) {
      console.error('Error getting Spotify access token:', error);
      throw new HttpException(
        'Failed to authenticate with Spotify',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async searchSongs(query: string): Promise<SearchResult> {
    try {
      const accessToken = await this.getSpotifyAccessToken();

      const response = await firstValueFrom(
        this.httpService.get<SpotifySearchResponse>(
          `${this.spotifyApiUrl}/search`,
          {
            params: {
              q: query,
              type: 'track',
              limit: 10,
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      if (!response.data?.tracks?.items) {
        return { tracks: { items: [], total: 0 } };
      }

      return {
        tracks: {
          items: response.data.tracks.items.map((track) => ({
            id: track.id,
            name: track.name,
            artist: track.artists.map((artist) => artist.name).join(', '),
            album: {
              name: track.album.name,
              images: track.album.images,
            },
            duration_ms: track.duration_ms,
            preview_url: track.preview_url,
          })),
          total: response.data.tracks.total,
        },
      };
    } catch (error) {
      console.error('Error searching songs:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to search songs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
