namespace CollectionApp.Models
{
    public class UpdateProfileRequest
    {
        public string CurrentUsername { get; set; }
        public string NewUsername { get; set; }
        public string NewPassword { get; set; }
        public string? NewAvatarKey { get; set; }
    }
}
