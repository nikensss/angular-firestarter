import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Board, Task } from './board.model';
import * as firebase from 'firebase/app';
import { switchMap, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  constructor(private afAuth: AngularFireAuth, private db: AngularFirestore) {}

  /**
   * Creates a new board for the current user.
   */
  async createBoard(data: Board) {
    const user = await this.afAuth.currentUser;

    return this.db.collection('boards').add({
      ...data,
      uid: user.uid,
      tasks: [{ description: 'New task', label: 'color' }]
    });
  }

  /**
   * Delete board
   */
  deleteBoard(boardId: string) {
    return this.getBoard(boardId).delete();
  }

  /**
   * Update the tasks on the board
   */
  updateTasks(boardId: string, tasks: Task[]) {
    return this.getBoard(boardId).update({ tasks });
  }

  /**
   * Removes a specific task from the board
   */
  removeTask(boardId: string, task: Task) {
    return this.getBoard(boardId).update({
      tasks: firebase.firestore.FieldValue.arrayRemove(task)
    });
  }

  /**
   * Get all the boards for the current user
   */
  getUserBoards(): Observable<any> {
    return this.afAuth.authState.pipe(
      switchMap((user) => {
        if (user) {
          return this.db
            .collection<Board>('boards', (ref) =>
              ref.where('uid', '==', user.uid).orderBy('priority')
            )
            .valueChanges({ idField: 'id' });
        } else {
          return [];
        }
      })
    );
  }

  /**
   * Run a batch write to change the priority of each board for sorting
   */
  sortBoards(boards: Board[]) {
    const db = firebase.firestore();
    const batch = db.batch();
    //map the frontend board to the backend board
    const refs = boards.map((b) => db.collection('boards').doc(b.id));
    refs.forEach((ref, idx) => batch.update(ref, { priority: idx }));
    batch.commit();
  }

  //Private implementations
  private getBoard(boardId: string) {
    return this.db.collection('boards').doc(boardId);
  }
}
