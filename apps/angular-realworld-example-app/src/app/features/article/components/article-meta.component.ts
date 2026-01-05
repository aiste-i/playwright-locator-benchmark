import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Article } from '../models/article.model';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-article-meta',
  template: `
    <div class="article-meta" [attr.data-testid]="'article-meta-' + article.slug">
      <a [routerLink]="['/profile', article.author.username]" [attr.data-testid]="'author-link-' + article.author.username">
        <img [src]="article.author.image" [attr.data-testid]="'author-image-' + article.author.username" />
      </a>

      <div class="info">
        <a class="author" [routerLink]="['/profile', article.author.username]" [attr.data-testid]="'author-name-' + article.author.username">
          {{ article.author.username }}
        </a>
        <span class="date" data-testid="article-date">
          {{ article.createdAt | date: 'longDate' }}
        </span>
      </div>

      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe],
})
export class ArticleMetaComponent {
  @Input() article!: Article;
}
