package proxy

import (
	"log/slog"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"github.com/luponetn/launch.io/internal/db"
)

type ReverseProxy struct {
	query *db.Queries
}

func NewReverseProxy(query *db.Queries) *ReverseProxy {
	return &ReverseProxy{query: query}
}

func (p *ReverseProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	host := strings.Split(r.Host, ":")[0]
	ctx := r.Context()

	domain, err := p.query.GetDomainByHostname(ctx, host)
	if err != nil {
		slog.Error("no project found for host", "host", host, "err", err)
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	mapping, err := p.query.GetActiveProxyMappingByProjectID(ctx, domain.ProjectID)
	if err != nil {
		slog.Error("no active deployment for project", "project_id", domain.ProjectID, "err", err)
		http.Error(w, "service unavailable", http.StatusServiceUnavailable)
		return
	}

	target, err := url.Parse("http://localhost:" + mapping.AssignedPort.String)
	if err != nil {
		slog.Error("invalid target port", "err", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	httputil.NewSingleHostReverseProxy(target).ServeHTTP(w, r)
}