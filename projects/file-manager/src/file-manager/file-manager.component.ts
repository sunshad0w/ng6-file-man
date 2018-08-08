import {Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewEncapsulation} from '@angular/core';
import {TreeModel} from './models/tree.model';
import {select, Store} from '@ngrx/store';
import {AppStore} from './reducers/reducer.factory';
import {NodeService} from './services/node.service';
import {SET_LOADING_STATE} from './reducers/actions.action';
import {NodeInterface} from './interfaces/node.interface';
import * as ACTIONS from './reducers/actions.action';

@Component({
  selector: 'fm-file-manager',
  templateUrl: './file-manager.component.html',
  styleUrls: ['./file-manager.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class FileManagerComponent implements OnInit {
  @Input() iconTemplate: TemplateRef<any>;
  @Input() modalTemplate: TemplateRef<any>;
  @Input() folderContentTemplate: TemplateRef<any>;
  @Input() folderContentBackTemplate: TemplateRef<any>;
  @Input() folderContentNewTemplate: TemplateRef<any>;
  @Input() loadingOverlayTemplate: TemplateRef<any>;

  @Input() tree: TreeModel;
  @Input() isPopup: boolean = false;
  @Output() itemClicked = new EventEmitter();

  selectedNode: NodeInterface;
  loading: boolean;
  sideMenuClosed = true;
  fmOpen = false;

  constructor(
    private store: Store<AppStore>,
    private nodeService: NodeService
  ) {
  }

  ngOnInit() {
    this.nodeService.tree = this.tree;
    this.nodeService.startManagerAt(this.tree.currentPath);

    this.store
      .pipe(select(state => state.fileManagerState.isLoading))
      .subscribe((data: boolean) => {
        this.loading = data;
      });

    this.store
      .pipe(select(state => state.fileManagerState.selectedNode))
      .subscribe((data: NodeInterface) => {
        if (!data) {
          return;
        }

        this.handleFileManagerClickEvent({type: 'select', node: data});
      });
  }

  onItemClicked(event: any): void {
    this.itemClicked.emit(event);
  }

  handleFileManagerClickEvent(event: any) {
    switch (event.type) {
      case 'close' :
        return this.nodeClickHandler(event.node, true);
      case 'select' :
        this.onItemClicked(event);
        this.highlightSelected(event.node.pathToNode);
        return this.nodeClickHandler(event.node);
      case 'download' :
        return this.onItemClicked(event);
      case 'rename' :
        return this.onItemClicked(event);
      case 'remove' :
        return this.onItemClicked(event);
    }
  }

  nodeClickHandler(node: NodeInterface, closing?: boolean) {
    if (node.isFolder) {
      return;
    }

    if (closing) {
      const parentNode = this.nodeService.findParent(node.pathToParent);
      this.store.dispatch({type: ACTIONS.SET_SELECTED_NODE, payload: parentNode});
      this.sideMenuClosed = true;
    }
    else {
      // todo fix this (kvoli tomu ze sa klika na ten isty node tak store ho ignoruje)
      if (this.selectedNode === node && this.sideMenuClosed)
        this.sideMenuClosed = false;
      else if (this.selectedNode === node && !this.sideMenuClosed)
        this.sideMenuClosed = true;
      else if (this.selectedNode !== node && this.sideMenuClosed)
        this.sideMenuClosed = false;
      else if (this.selectedNode !== node && !this.sideMenuClosed)
        this.sideMenuClosed = false;
    }

    this.selectedNode = node;

    if (this.sideMenuClosed) {
      document.getElementById('side-view').classList.remove('selected');
    } else {
      document.getElementById('side-view').classList.add('selected');
    }
  }

  highlightSelected(pathToNode: string) {
    if (pathToNode.length === 0) {
      pathToNode = 'root';
    }

    const element = document.getElementById(pathToNode);
    if (!element) {
      console.warn('[File Manager] failed to find requested node for path:', pathToNode);
      return;
    }

    Array.from(document.getElementsByClassName('highlighted'))
      .map((el: HTMLElement) => el.classList.remove('highlighted'));

    element
      .children[0] // appnode div wrapper
      .children[0] // ng template first item
      .classList.add('highlighted');
  }

  fmShowHide() {
    this.fmOpen = !this.fmOpen;
  }

  backdropClicked() {
    // todo get rid of this ugly workaround
    // todo fire userCanceledLoading event
    this.store.dispatch({type: SET_LOADING_STATE, payload: false});
  }
}