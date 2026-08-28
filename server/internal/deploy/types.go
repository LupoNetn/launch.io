package deploy


type GitHubRepo struct {
    ID            int64  `json:"id"`
    Name          string `json:"name"`
    FullName      string `json:"full_name"`
    Private       bool   `json:"private"`
    CloneURL      string `json:"clone_url"`
    SSHURL        string `json:"ssh_url"`
    DefaultBranch string `json:"default_branch"`
    HTMLURL       string `json:"html_url"`
}