import { action } from '@ember/object';
import Component from '@glimmer/component';
import { bind } from '@ember/runloop';
import jQuery from 'jquery';
import { set } from '@ember/object';

var $window = jQuery(window);

var EPSILON = 150;

export default class InfiniteScroll extends Component {
  action = 'fetchMore';
  epsilon = EPSILON;
  isFetching = false;
  hasMore = null;
  content = null;
  scrollable = null;
  $scrollable = null;

  @action
  setup() {
    var scrollable = this.args.scrollable,
      $scrollable = scrollable ? jQuery(scrollable) : $window;
    this.$scrollable = $scrollable;
    const el = document.getElementById(this.args.scrollable.replace('#', ''));
    el.addEventListener('scroll', () => this.didScroll());
  }

  @action
  teardown() {
    this.$scrollable.off('scroll.' + this.elementId);
  }

  didScroll() {
    if (!this.isFetching && this.args.hasMore && this.isNearBottom()) {
      this.safeSet('isFetching', true);
      this.args.action((promise) => {
        this.handleFetch(promise);
      });
    }
  }

  handleFetch(promise) {
    var success = bind(this, this.fetchDidSucceed),
      failure = bind(this, this.fetchDidFail);

    promise.then(success, failure);
  }

  fetchDidSucceed(response) {
    var content = this.content,
      newContent = response.content || response;

    this.safeSet('isFetching', false);
    if (content) {
      content.pushObjects(newContent);
    }
  }

  fetchDidFail() {
    this.safeSet('isFetching', false);
  }

  isNearBottom() {
    var $scrollable = this.$scrollable,
      viewPortTop,
      bottomTop;

    if ($scrollable === $window) {
      viewPortTop = jQuery(document).scrollTop();
      bottomTop = jQuery(document).height() - jQuery(window).height();
    } else {
      viewPortTop = $scrollable.scrollTop();
      bottomTop = $scrollable[0].scrollHeight - $scrollable.innerHeight();
    }

    return viewPortTop && bottomTop - viewPortTop < this.epsilon;
  }

  safeSet(key, value) {
    if (!this.isDestroyed && !this.isDestroying) {
      set(this, key, value);
    }
  }
}
