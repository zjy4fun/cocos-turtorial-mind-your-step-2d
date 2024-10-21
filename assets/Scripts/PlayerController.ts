import {
  _decorator,
  Component,
  EventMouse,
  input,
  Input,
  log,
  Node,
  Vec3,
  Animation,
  EventTouch,
} from "cc";
const { ccclass, property } = _decorator;

export const BLOCK_SIZE = 40; // 添加一个放大比

@ccclass("PlayerController")
export class PlayerController extends Component {
  @property(Animation)
  BodyAnim: Animation = null;

  @property(Node)
  leftTouch: Node = null;

  @property(Node)
  rightTouch: Node = null;

  /** 是否开始跳跃，用于判断角色是否在跳跃状态 */
  private _startJump: boolean = false;

  /** 跳跃的步数，规定角色最多只能跳两步，那么它可能是 1 或者 2 */
  private _jumpStep: number = 0;

  /** 当前跳跃时间，每次跳跃前，将这个值置 0，在更新时进行累积并和 _jumpTime 作对比，如果超过了 _jumpTime，那么我们认为角色完成了一次完整的跳跃 */
  private _curJumpTime: number = 0;

  /** 跳跃时间，用于记录整个跳跃的时长 */
  private _jumpTime: number = 0.1;

  /** 移动速度 */
  private _curJumpSpeed: number = 0;

  /** 当前的位置 */
  private _curPos: Vec3 = new Vec3();

  /** 位移 */
  private _deltaPos: Vec3 = new Vec3(0, 0, 0);

  /** 目标位置 */
  private _targetPos: Vec3 = new Vec3();

  /** 记录角色当前多少步 */
  private _curMoveIndex: number = 0;

  start() {
    // input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
  }

  setInputActive(active: boolean) {
    if (active) {
      this.leftTouch.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
      this.rightTouch.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
    } else {
      this.leftTouch.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
      this.rightTouch.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
    }
  }

  onTouchStart(event: EventTouch) {
    const target = event.target as Node;
    if (target?.name == "LeftTouch") {
      this.jumpByStep(1);
    } else {
      this.jumpByStep(2);
    }
  }

  update(deltaTime: number) {
    if (this._startJump) {
      this._curJumpTime += deltaTime; // 累积总的跳跃时间
      if (this._curJumpTime > this._jumpTime) {
        // 当跳跃时间结束
        // end
        this.node.setPosition(this._targetPos); // 强制位置到终点
        this._startJump = false; // 清理跳跃标记
        this.onOnceJumpEnd();
      } else {
        // tween
        this.node.getPosition(this._curPos); // 获取当前位置
        this._deltaPos.x = this._curJumpSpeed * deltaTime; // 每一帧根据速度和时间计算位移
        Vec3.add(this._curPos, this._curPos, this._deltaPos); // 应用这个位移
        this.node.setPosition(this._curPos); // 将位移设置给角色
      }
    }
  }

  onMouseUp(event: EventMouse) {
    if (event.getButton() === 0) {
      // left
      this.jumpByStep(1);
    } else if (event.getButton() === 2) {
      // right
      this.jumpByStep(2);
    }
  }

  jumpByStep(step: number) {
    if (this._startJump) {
      return;
    }
    this._startJump = true;
    this._jumpStep = step;
    this._curJumpTime = 0; // 重置开始跳跃的时间

    // 通过获取动画剪辑的时长动态调整跳跃时间
    const clipName = step === 1 ? "oneStep" : "twoStep";
    const state = this.BodyAnim.getState(clipName);
    this._jumpTime = state.duration;

    this._curJumpSpeed = (this._jumpStep * BLOCK_SIZE) / this._jumpTime; // 计算出速度
    this.node.getPosition(this._curPos); // 获取角色当前位置
    // Vec3.add 用于计算两个向量相加的结果，结果保存在第一个参数里面
    Vec3.add(
      this._targetPos,
      this._curPos,
      new Vec3(this._jumpStep * BLOCK_SIZE, 0, 0)
    ); // 计算出目标位置

    if (step === 1) {
      this.BodyAnim.play("oneStep");
    } else if (step === 2) {
      this.BodyAnim.play("twoStep");
    }

    this._curMoveIndex += step;
  }

  reset() {
    this._curMoveIndex = 0;
    this.node.getPosition(this._curPos);
    this._targetPos.set(0, 0, 0);
  }

  onOnceJumpEnd() {
    console.log("onOnceJumpEnd _curMoveIndex: ", this._curMoveIndex);
    this.node.emit("JumpEnd", this._curMoveIndex);
  }
}
