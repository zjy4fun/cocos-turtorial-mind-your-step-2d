import {
  _decorator,
  CCInteger,
  Component,
  instantiate,
  Label,
  Node,
  Prefab,
  Vec3,
} from "cc";
import { BLOCK_SIZE, PlayerController } from "./PlayerController";
const { ccclass, property } = _decorator;

enum GameState {
  GS_INIT,
  GS_PLAYING,
  GS_END,
}

enum BlockType {
  BT_NONE,
  BT_STONE,
}

@ccclass("GameManager")
export class GameManager extends Component {
  @property({ type: Prefab })
  public boxPrefab: Prefab | null = null;

  @property({ type: CCInteger })
  public roadLength: number = 50;
  private _road: BlockType[] = [];

  // init 状态下需要初始化地图，将角色放回到初始点，显示游戏的 UI
  @property({ type: Node })
  public startMenu: Node | null = null;
  @property({ type: PlayerController })
  public playerCtrl: PlayerController | null = null;
  @property({ type: Label })
  public stepsLabel: Label | null = null;

  start() {
    console.log('GameManager start');
    this.setCurState(GameState.GS_INIT);
    this.playerCtrl?.node.on("JumpEnd", this.onPlayerJumpEnd, this);
  }

  init() {
    if (this.startMenu) {
      this.startMenu.active = true;
    }
    this.generateRoad();
    if (this.playerCtrl) {
      this.playerCtrl.setInputActive(false);
      this.playerCtrl.node.setPosition(Vec3.ZERO);
      this.playerCtrl.reset();
    }
  }

  setCurState(value: GameState) {
    switch (value) {
      case GameState.GS_INIT:
        this.init();
        break;
      case GameState.GS_PLAYING:
        if (this.startMenu) {
          this.startMenu.active = false;
        }
        if (this.stepsLabel) {
          this.stepsLabel.string = "0"; // 重置步数
        }

        // 直接设置active 会直接开始监听鼠标事件，做一下延迟处理
        setTimeout(() => {
          if (this.playerCtrl) {
            this.playerCtrl.setInputActive(true);
          }
        }, 0.1);
        break;
      case GameState.GS_END:
        break;
    }
  }

  update(deltaTime: number) {}

  generateRoad() {
    this.node.removeAllChildren();

    this._road = [];
    // startPos
    this._road.push(BlockType.BT_STONE);

    for (let i = 1; i < this.roadLength; i++) {
      if (this._road[i - 1] === BlockType.BT_NONE) {
        this._road.push(BlockType.BT_STONE);
      } else {
        this._road.push(Math.floor(Math.random() * 2));
      }
    }

    for (let j = 0; j < this._road.length; j++) {
      let block: Node | null = this.spawnBlockByType(this._road[j]);
      if (block) {
        this.node.addChild(block);
        block.setPosition(j * BLOCK_SIZE, 0, 0);
      }
    }
  }

  spawnBlockByType(type: BlockType) {
    if (!this.boxPrefab) {
      return null;
    }

    let block: Node | null = null;
    switch (type) {
      case BlockType.BT_STONE:
        block = instantiate(this.boxPrefab);
        break;
    }

    return block;
  }

  onStartButtonClicked() {
    this.setCurState(GameState.GS_PLAYING);
  }

  onPlayerJumpEnd(moveIndex: number) {
    console.log('onPlayerJumpEnd moveIndex: ', moveIndex);
    if (this.stepsLabel) {
      this.stepsLabel.string =
        "" + (moveIndex >= this.roadLength ? this.roadLength : moveIndex);
    }
    this.checkResult(moveIndex);
  }

  // 判定角色是否跳跃到坑或者跳完所有地块的方法
  checkResult(moveIndex: number) {
    if (moveIndex < this.roadLength) {
      if (this._road[moveIndex] === BlockType.BT_NONE) {
        this.setCurState(GameState.GS_INIT);
      }
    } else {
      this.setCurState(GameState.GS_INIT);
    }
  }
}
