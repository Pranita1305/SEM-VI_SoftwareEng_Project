from __future__ import annotations

import re
from typing import Any

from backend.api.repository import prediction_repository
from backend.api.schemas import ChatResponse, InsightCard


class ChatbotService:
    def __init__(self) -> None:
        self._zone_pattern = re.compile(r"zone\s*(\d+)", re.IGNORECASE)
        self._hour_pattern = re.compile(r"(?:in|next)\s*(\d+)\s*hours?", re.IGNORECASE)

    def answer(self, message: str, model_name: str) -> ChatResponse:
        predictions, source = prediction_repository.list_predictions(model_name=model_name)
        normalized = message.lower().strip()

        if not predictions:
            return ChatResponse(
                answer="No prediction data is available right now. Please try again in a moment.",
                intent="no_data",
                source=source,
                supporting_points=["Prediction data refreshes every hour."],
                insights=[],
            )

        zone = self._match_zone(predictions, normalized)
        hour_offset = self._extract_hour_offset(normalized)

        if self._is_high_demand_query(normalized):
            return self._answer_high_demand(predictions, source)
        if self._is_surge_query(normalized):
            return self._answer_surge(predictions, zone, source)
        if self._is_forecast_query(normalized):
            return self._answer_forecast(predictions, zone, hour_offset, source)
        return self._answer_summary(predictions, source)

    def _match_zone(self, predictions: list[dict[str, Any]], message: str) -> dict[str, Any] | None:
        match = self._zone_pattern.search(message)
        if match:
            zone_id = int(match.group(1))
            return next((doc for doc in predictions if doc["zone_id"] == zone_id), None)

        for doc in predictions:
            if doc["zone_name"].lower() in message:
                return doc
        return None

    def _extract_hour_offset(self, message: str) -> int:
        match = self._hour_pattern.search(message)
        return int(match.group(1)) if match else 0

    def _is_high_demand_query(self, message: str) -> bool:
        return any(keyword in message for keyword in ["high demand", "hotspot", "highest demand", "busy zones"])

    def _is_surge_query(self, message: str) -> bool:
        return "surge" in message or "pricing" in message

    def _is_forecast_query(self, message: str) -> bool:
        return any(keyword in message for keyword in ["predicted", "forecast", "next", "in "]) or "demand" in message

    def _answer_high_demand(self, predictions: list[dict[str, Any]], source: str) -> ChatResponse:
        ranked = sorted(predictions, key=lambda item: item["current_demand"], reverse=True)
        top = ranked[0]
        answer = (
            f"{top['zone_name']} is the current hotspot with an estimated demand of {top['current_demand']} rides "
            f"and a {top['surge_multiplier']:.1f}x surge multiplier."
        )
        supporting_points = [
            f"{doc['zone_name']}: {doc['current_demand']} rides, {doc['surge_multiplier']:.1f}x surge"
            for doc in ranked[:3]
        ]
        insights = [
            InsightCard(label="Hotspot", value=top["zone_name"]),
            InsightCard(label="Peak demand", value=str(top["current_demand"])),
            InsightCard(label="Model", value=top["model_name"]),
        ]
        return ChatResponse(
            answer=answer,
            intent="high_demand",
            source=source,
            supporting_points=supporting_points,
            insights=insights,
        )

    def _answer_surge(self, predictions: list[dict[str, Any]], zone: dict[str, Any] | None, source: str) -> ChatResponse:
        if zone is None:
            zone = max(predictions, key=lambda item: item["surge_multiplier"])
            answer = (
                f"The strongest surge right now is in {zone['zone_name']} at {zone['surge_multiplier']:.1f}x. "
                "Ask about a specific zone to get a zone-wise answer."
            )
        else:
            surge_active = zone["surge_multiplier"] > 1.0
            answer = (
                f"Surge pricing is {'active' if surge_active else 'not active'} in {zone['zone_name']}. "
                f"The current multiplier is {zone['surge_multiplier']:.1f}x with {zone['current_demand']} predicted rides."
            )
        return ChatResponse(
            answer=answer,
            intent="surge_check",
            source=source,
            supporting_points=[
                f"Demand status: {zone['trend'].title()}",
                f"Current demand: {zone['current_demand']} rides",
                f"Forecast model: {zone['model_name']}",
            ],
            insights=[
                InsightCard(label="Zone", value=zone["zone_name"]),
                InsightCard(label="Surge", value=f"{zone['surge_multiplier']:.1f}x"),
                InsightCard(label="Trend", value=zone["trend"].title()),
            ],
        )

    def _answer_forecast(
        self,
        predictions: list[dict[str, Any]],
        zone: dict[str, Any] | None,
        hour_offset: int,
        source: str,
    ) -> ChatResponse:
        target_zone = zone or max(predictions, key=lambda item: item["current_demand"])
        forecast_entry = next(
            (point for point in target_zone["forecast"] if point["hour_offset"] == min(hour_offset, 4)),
            target_zone["forecast"][0],
        )
        answer = (
            f"The predicted demand for {target_zone['zone_name']} in {forecast_entry['hour_offset']} hour(s) is "
            f"{forecast_entry['predicted_demand']} rides using the {target_zone['model_name']} model."
        )
        supporting_points = [
            f"Now: {target_zone['forecast'][0]['predicted_demand']} rides",
            f"+2h: {target_zone['forecast'][2]['predicted_demand']} rides",
            f"+4h: {target_zone['forecast'][4]['predicted_demand']} rides",
        ]
        insights = [
            InsightCard(label="Zone", value=target_zone["zone_name"]),
            InsightCard(label="Requested horizon", value=f"+{forecast_entry['hour_offset']}h"),
            InsightCard(label="Prediction", value=str(forecast_entry["predicted_demand"])),
        ]
        return ChatResponse(
            answer=answer,
            intent="forecast_lookup",
            source=source,
            supporting_points=supporting_points,
            insights=insights,
        )

    def _answer_summary(self, predictions: list[dict[str, Any]], source: str) -> ChatResponse:
        hotspot = max(predictions, key=lambda item: item["current_demand"])
        avg_surge = sum(item["surge_multiplier"] for item in predictions) / len(predictions)
        answer = (
            "I can answer demand, surge, and forecast questions using the stored prediction records. "
            f"Right now the top hotspot is {hotspot['zone_name']} and the network average surge is {avg_surge:.2f}x."
        )
        return ChatResponse(
            answer=answer,
            intent="summary",
            source=source,
            supporting_points=[
                "Try: Which zones are in high demand right now?",
                "Try: Is surge active in Whitefield?",
                "Try: Predicted demand for Zone 3 in 2 hours?",
            ],
            insights=[
                InsightCard(label="Hotspot", value=hotspot["zone_name"]),
                InsightCard(label="Avg surge", value=f"{avg_surge:.2f}x"),
                InsightCard(label="Records", value=str(len(predictions))),
            ],
        )


chatbot_service = ChatbotService()