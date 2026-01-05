import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { UserService } from '../../../core/auth/services/user.service';
import { User } from '../../../core/auth/user.model';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { Comment } from '../models/comment.model';
import { AsyncPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-article-comment',
  template: `
    @if (comment) {
      <div class="card" [attr.data-testid]="'comment-' + comment.id">
        <div class="card-block">
          <p class="card-text" [attr.data-testid]="'comment-body-' + comment.id">
            {{ comment.body }}
          </p>
        </div>
        <div class="card-footer">
          <a class="comment-author" [routerLink]="['/profile', comment.author.username]" [attr.data-testid]="'comment-author-' + comment.id">
            <img [src]="comment.author.image" class="comment-author-img" [attr.data-testid]="'comment-author-img-' + comment.id" />
          </a>
          &nbsp;
          <a class="comment-author" [routerLink]="['/profile', comment.author.username]" [attr.data-testid]="'comment-author-name-' + comment.id">
            {{ comment.author.username }}
          </a>
          <span class="date-posted" [attr.data-testid]="'comment-date-' + comment.id">
            {{ comment.createdAt | date: 'longDate' }}
          </span>
          @if (canModify$ | async) {
            <span class="mod-options">
              <i class="ion-trash-a" (click)="delete.emit(true)" [attr.data-testid]="'delete-comment-' + comment.id"></i>
            </span>
          }
        </div>
      </div>
    }
  `,
  imports: [RouterLink, DatePipe, AsyncPipe],
})
export class ArticleCommentComponent {
  @Input() comment!: Comment;
  @Output() delete = new EventEmitter<boolean>();

  canModify$ = inject(UserService).currentUser.pipe(
    map((userData: User | null) => userData?.username === this.comment.author.username),
  );
}
