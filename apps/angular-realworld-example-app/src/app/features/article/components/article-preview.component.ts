import { Component, Input } from '@angular/core';
import { Article } from '../models/article.model';
import { ArticleMetaComponent } from './article-meta.component';
import { RouterLink } from '@angular/router';

import { FavoriteButtonComponent } from './favorite-button.component';

@Component({
  selector: 'app-article-preview',
  template: `
    <div class="article-preview">
      <app-article-meta [article]="article" [attr.data-testid]="'article-meta-' + article.slug">
        <app-favorite-button [article]="article" (toggle)="toggleFavorite($event)" class="pull-xs-right" [attr.data-testid]="'favorite-' + article.slug">
          {{ article.favoritesCount }}
        </app-favorite-button>
      </app-article-meta>

      <a [routerLink]="['/article', article.slug]" class="preview-link" [attr.data-testid]="'article-link-' + article.slug">
        <h1 [attr.data-testid]="'article-title-' + article.slug">{{ article.title }}</h1>
        <p [attr.data-testid]="'article-desc-' + article.slug">{{ article.description }}</p>
        <span [attr.data-testid]="'read-more-' + article.slug">Read more...</span>
        <ul class="tag-list">
          @for (tag of article.tagList; track tag) {
            <li class="tag-default tag-pill tag-outline" [attr.data-testid]="'tag-' + tag">
              {{ tag }}
            </li>
          }
        </ul>
      </a>
    </div>
  `,
  imports: [ArticleMetaComponent, FavoriteButtonComponent, RouterLink],
})
export class ArticlePreviewComponent {
  @Input() article!: Article;

  toggleFavorite(favorited: boolean): void {
    this.article.favorited = favorited;

    if (favorited) {
      this.article.favoritesCount++;
    } else {
      this.article.favoritesCount--;
    }
  }
}
