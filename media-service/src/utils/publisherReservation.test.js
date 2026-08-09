import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  releasePublisherReservation,
  tryReservePublisher,
} from "./publisherReservation.js";

describe("publisher reservation", () => {
  it("reserves a path for only the first exact session", () => {
    const reservations = new Map();
    const first = { id: "first" };
    const duplicate = { id: "duplicate" };

    assert.equal(tryReservePublisher(reservations, "/live/key", first), true);
    assert.equal(
      tryReservePublisher(reservations, "/live/key", duplicate),
      false,
    );
    assert.equal(reservations.get("/live/key"), first);
  });

  it("does not let a different session release the valid reservation", () => {
    const reservations = new Map([["/live/key", { id: "first" }]]);
    const owner = reservations.get("/live/key");
    const duplicate = { id: "duplicate" };

    assert.equal(
      releasePublisherReservation(reservations, "/live/key", duplicate),
      false,
    );
    assert.equal(reservations.get("/live/key"), owner);
    assert.equal(
      releasePublisherReservation(reservations, "/live/key", owner),
      true,
    );
    assert.equal(reservations.has("/live/key"), false);
  });
});
