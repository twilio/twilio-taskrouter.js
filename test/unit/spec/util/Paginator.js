import { describe, it } from 'mocha';
import Paginator from '../../../../lib/util/Paginator';
const chai = require('chai');
const expect = chai.expect;

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

describe('Paginator', () => {
  describe('constructor', () => {
    it('should throw an error if items are missing', () => {
      (() => {
        new Paginator();
      }).should.throw(/items is a required parameter/);
    });

    it('should throw an error if the source is missing', () => {
      (() => {
        new Paginator([]);
      }).should.throw(/source is a required parameter/);
    });

    it('should know if it has a next page', () => {
      const nextPageToken = 'ABC';
      let paginator = new Paginator([], num => getRandomInt(num), nextPageToken);
      expect(paginator.hasNextPage).to.equal(true);

      paginator = new Paginator([], num => getRandomInt(num), null);
      expect(paginator.hasNextPage).to.equal(false);
    });
  });

  describe('#nextPage', () => {
    it('should throw an error if there is no next page to fetch', () => {
      const paginator = new Paginator([], num => getRandomInt(num), null);
      return paginator.nextPage().catch(err => {
        expect(err.name).to.equal('TASKROUTER_ERROR');
        expect(err.message).to.equal('Error getting the next page. No next page exists.');
      });
    });

    it('should call the source function with the nextToken', () => {
      const nextToken = 10;
      const paginator = new Paginator([], num => getRandomInt(num), nextToken);

      const result = paginator.nextPage();
      expect(result <= 10).to.equal(true);
    });
  });
});
